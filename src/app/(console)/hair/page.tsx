"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import {
  HAIR_QUESTIONS,
  HAIR_COPY,
  type Questionnaire,
} from "@/lib/hair/content";

interface Style {
  id: string;
  slug: string | null;
  name: string;
  rationale: string | null;
  brief: string | null;
  full_brief: string | null;
  preview_path: string | null;
  status: string;
}
interface Read {
  face_shape: string | null;
  hair_type: string | null;
}

type Mode = "loading" | "need-scan" | "questionnaire" | "results";

export default function HairPage() {
  const [mode, setMode] = useState<Mode>("loading");
  const [answers, setAnswers] = useState<Partial<Questionnaire>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [read, setRead] = useState<Read>({ face_shape: null, hair_type: null });
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // ---- initial load: scan? existing recommendations? ----
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: scan } = await supabase
        .from("scans")
        .select("id")
        .eq("user_id", user.id)
        .eq("kind", "selfie")
        .limit(1)
        .maybeSingle();
      if (!scan) {
        setMode("need-scan");
        return;
      }

      const [{ data: hs }, { data: hp }, { data: prof }] = await Promise.all([
        supabase
          .from("hair_styles")
          .select("id, slug, name, rationale, brief, full_brief, preview_path, status")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
        supabase.from("hair_profiles").select("hair_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("face_shape").eq("id", user.id).maybeSingle(),
      ]);

      if (hs && hs.length) {
        setStyles(hs as Style[]);
        setRead({ face_shape: prof?.face_shape ?? null, hair_type: hp?.hair_type ?? null });
        setSelectedId(hs[0].id);
        setMode("results");
      } else {
        setMode("questionnaire");
      }
    })();
  }, []);

  // ---- ensure the selected style has an on-you preview ----
  const ensurePreview = useCallback(
    async (style: Style) => {
      if (previews[style.id]) return;
      const supabase = createClient();
      // Already rendered → just sign it.
      if (style.status === "ready" && style.preview_path) {
        const { data } = await supabase.storage
          .from("user-media")
          .createSignedUrl(style.preview_path, 3600);
        if (data?.signedUrl) setPreviews((p) => ({ ...p, [style.id]: data.signedUrl }));
        return;
      }
      // Generate it.
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/hair/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ styleId: style.id }),
        });
        const json = await res.json();
        if (json.url) {
          setPreviews((p) => ({ ...p, [style.id]: json.url }));
          setStyles((prev) =>
            prev.map((s) => (s.id === style.id ? { ...s, status: "ready" } : s)),
          );
        } else {
          setError("Couldn't render that style — try again.");
        }
      } catch {
        setError("Couldn't render that style — try again.");
      } finally {
        setPreviewLoading(false);
      }
    },
    [previews],
  );

  // Generate the preview whenever the selection changes.
  useEffect(() => {
    if (mode !== "results" || !selectedId) return;
    const style = styles.find((s) => s.id === selectedId);
    if (style) ensurePreview(style);
    setShowFull(false);
  }, [mode, selectedId, styles, ensurePreview]);

  async function submit() {
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/hair/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionnaire: answers }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "no-scan" ? "Take a scan first." : "Analysis failed — try again.");
        setAnalyzing(false);
        return;
      }
      setStyles(json.styles);
      setRead({ face_shape: json.read.face_shape, hair_type: json.read.hair_type });
      setSelectedId(json.styles[0]?.id ?? null);
      setMode("results");
    } catch {
      setError("Analysis failed — try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function save(style: Style) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("saved_looks").insert({
      user_id: user.id,
      kind: "hair",
      ref_id: style.id,
      title: style.name,
      image_path: style.preview_path,
    });
    setSavedIds((s) => new Set(s).add(style.id));
  }

  const allAnswered = HAIR_QUESTIONS.every((q) => answers[q.id]);
  const selected = styles.find((s) => s.id === selectedId) ?? null;

  // ============================ states ============================
  if (mode === "loading") {
    return <p className="font-mono text-[13px] text-stone">Loading…</p>;
  }

  if (mode === "need-scan") {
    return (
      <div className="max-w-[520px]">
        <p className="eyebrow mb-4">hair</p>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em] mb-4">
          {HAIR_COPY.needScanTitle}
        </h1>
        <p className="text-graphite text-[clamp(16px,2vw,18px)] leading-relaxed max-w-[42ch] mb-8">
          {HAIR_COPY.needScanBody}
        </p>
        <Button href="/scan" size="lg">
          {HAIR_COPY.needScanCta}
        </Button>
      </div>
    );
  }

  if (mode === "questionnaire") {
    return (
      <div className="max-w-[640px]">
        <p className="eyebrow mb-4">{HAIR_COPY.introEyebrow}</p>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em] mb-3">
          {HAIR_COPY.introTitle}
        </h1>
        <p className="text-graphite text-[clamp(15px,1.8vw,17px)] leading-relaxed max-w-[44ch] mb-8">
          {HAIR_COPY.introBody}
        </p>

        <div className="grid gap-6">
          {HAIR_QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-stone mb-3">
                {q.label}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {q.options.map((o) => {
                  const active = answers[q.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
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
          <Button onClick={submit} size="lg" disabled={!allAnswered || analyzing}>
            {analyzing ? HAIR_COPY.analyzing : HAIR_COPY.analyze}
          </Button>
        </div>
      </div>
    );
  }

  // ============================ results ============================
  return (
    <>
      <header className="mb-[clamp(20px,3vh,32px)] flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">{HAIR_COPY.resultsEyebrow}</p>
          <h1 className="font-display text-[clamp(30px,4.5vw,46px)] font-bold leading-[0.95] tracking-[-0.04em]">
            {HAIR_COPY.resultsTitle}
          </h1>
        </div>
        <div className="hidden sm:flex gap-8 pt-2 text-right">
          {read.face_shape && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-1.5">
                Face shape
              </p>
              <p className="font-display text-[18px] tracking-[-0.02em] text-ink">
                {read.face_shape}
              </p>
            </div>
          )}
          {read.hair_type && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-1.5">
                Hair
              </p>
              <p className="font-display text-[18px] tracking-[-0.02em] text-ink">
                {read.hair_type}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-[clamp(16px,2.5vw,32px)] lg:grid-cols-2">
        {/* Preview */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-[#2C2B27]">
          {selected && previews[selected.id] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previews[selected.id]}
              alt={`${selected.name} previewed on you`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-bronze" />
                  <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#F4F2EC]/70">
                    {HAIR_COPY.generating}
                  </p>
                </div>
              ) : (
                <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#F4F2EC]/40">
                  select a style
                </p>
              )}
            </div>
          )}
          {selected && previews[selected.id] && (
            <span className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F4F2EC]/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
              <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
              {HAIR_COPY.previewedOnYou}
            </span>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div className="flex flex-col">
            <h2 className="font-display text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em] text-ink mb-3">
              {selected.name}
            </h2>
            <p className="text-graphite text-[clamp(15px,1.7vw,18px)] leading-relaxed mb-6">
              {selected.rationale}
            </p>

            <div className="rounded-[16px] border border-[var(--ink-08)] bg-cloud p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-2.5">
                {showFull ? HAIR_COPY.fullBrief.toLowerCase() : HAIR_COPY.quickBrief}
              </p>
              <p className="text-ink text-[15px] leading-relaxed">
                {showFull ? selected.full_brief : selected.brief}
              </p>
            </div>

            <div className="mt-auto grid gap-3 pt-8">
              <Button
                onClick={() => save(selected)}
                disabled={savedIds.has(selected.id)}
                className="w-full justify-center"
                size="lg"
              >
                {savedIds.has(selected.id) ? HAIR_COPY.saved : HAIR_COPY.save}
              </Button>
              <button
                type="button"
                onClick={() => setShowFull((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--ink-12)] py-3.5 font-display text-[15px] font-medium text-ink transition-colors hover:border-bronze"
              >
                <span className="h-3.5 w-3.5 rounded-[3px] border-[1.5px] border-current" />
                {showFull ? "Show quick brief" : HAIR_COPY.fullBrief}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-5 text-[14px] text-bronze">{error}</p>}

      {/* Other styles */}
      <p className="eyebrow mt-[clamp(28px,4vh,44px)] mb-5">{HAIR_COPY.otherStyles}</p>
      <div className="grid grid-cols-2 gap-[clamp(12px,1.4vw,18px)] lg:grid-cols-4">
        {styles.map((s) => {
          const active = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`overflow-hidden rounded-[16px] border text-left transition-colors ${
                active ? "border-bronze" : "border-[var(--ink-08)] hover:border-[rgba(176,122,60,0.5)]"
              }`}
            >
              <div className="relative aspect-square bg-[#2C2B27]">
                {previews[s.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[s.id]} alt={s.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="h-[15px] w-[15px] rounded-[4px] border-[1.5px] border-[#F4F2EC]/40" />
                  </span>
                )}
              </div>
              <p className={`px-3 py-2.5 text-[14px] ${active ? "text-ink font-medium" : "text-graphite"}`}>
                {s.name}
              </p>
            </button>
          );
        })}
      </div>
    </>
  );
}
