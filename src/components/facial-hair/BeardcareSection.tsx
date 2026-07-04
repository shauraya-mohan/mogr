"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { canonical } from "@/lib/cacheKey";
import { useRoutine } from "@/lib/routine/useRoutine";
import { findStep, shortenLabel, shortenDetail } from "@/lib/routine/content";
import {
  BEARDCARE_SKIN,
  BEARDCARE_FIELDS,
  BEARDCARE_CONCERNS,
  BEARDCARE_COPY,
  type BeardcareAnswers,
} from "@/lib/facial-hair/content";

interface Tips {
  summary: string;
  routine: { step: string; detail: string; cadence: string }[];
  products: { type: string; ingredient: string; why: string }[];
  styling: string[];
}

type Mode = "loading" | "intro" | "form" | "tips";

const PILL_BASE = "rounded-full border px-4 py-2 text-[14px] transition-colors";
const PILL_ON = "border-ink bg-ink text-bone";
const PILL_OFF = "border-[var(--ink-12)] text-graphite hover:border-bronze hover:text-ink";
const HEADING = "font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-3";

/**
 * Beard-care routine — a self-contained section appended to the facial-hair
 * results. Collects a short manual form, generates a text routine via
 * /api/facial-hair/beardcare, and persists it to facial_hair_profiles.data.beardcare.
 * Independent of the styles UI. Mirrors components/hair/HaircareSection.tsx.
 */
export default function BeardcareSection() {
  const [mode, setMode] = useState<Mode>("loading");
  const [answers, setAnswers] = useState<BeardcareAnswers>({ skin: [], concerns: [] });
  const [tips, setTips] = useState<Tips | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Canonical key of the answers that produced the currently-shown routine.
  // Re-submitting an identical form short-circuits (no API call, no regen).
  const [builtKey, setBuiltKey] = useState<string | null>(null);
  const routineCtl = useRoutine();
  const [added, setAdded] = useState(false);

  // One tap sends the whole beard-care routine to the routine page (Morning),
  // deduped against what's already there.
  function addAllToRoutine() {
    if (!tips) return;
    const items = tips.routine
      .map((r) => ({
        source: "facial_hair" as const,
        label: shortenLabel(r.step),
        timeOfDay: "am" as const,
        note: r.cadence || shortenDetail(r.detail),
      }))
      .filter((it) => !findStep(routineCtl.steps, it.source, it.label, it.timeOfDay));
    if (items.length) routineCtl.addMany(items);
    setAdded(true);
  }

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMode("intro");
        return;
      }
      const { data } = await supabase
        .from("facial_hair_profiles")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();
      const d = (data?.data ?? {}) as { beardcare?: { answers?: BeardcareAnswers; tips?: Tips } };
      const bc = d.beardcare ?? null;
      if (bc?.tips) {
        setTips(bc.tips);
        if (bc.answers) {
          const loaded = {
            ...bc.answers,
            skin: bc.answers.skin ?? [],
            concerns: bc.answers.concerns ?? [],
          };
          setAnswers(loaded);
          setBuiltKey(canonical(loaded));
        }
        setMode("tips");
      } else {
        setMode("intro");
      }
    })();
  }, []);

  function setField(id: "length" | "products", value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }
  function toggleIn(key: "skin" | "concerns", value: string) {
    setAnswers((a) => ({
      ...a,
      [key]: a[key].includes(value)
        ? a[key].filter((c) => c !== value)
        : [...a[key], value],
    }));
  }

  const ready = answers.skin.length > 0 && !!answers.length && !!answers.products;

  async function build() {
    // Unchanged from the routine already shown → keep it, no regeneration.
    const key = canonical(answers);
    if (tips && builtKey && key === builtKey) {
      setMode("tips");
      return;
    }
    setBuilding(true);
    setError(null);
    try {
      const res = await fetch("/api/facial-hair/beardcare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beardcare: answers }),
      });
      const json = await res.json();
      if (!res.ok || !json.tips) {
        setError("Couldn't build your routine. Try again.");
        return;
      }
      setTips(json.tips);
      setBuiltKey(key);
      setMode("tips");
    } catch {
      setError("Couldn't build your routine. Try again.");
    } finally {
      setBuilding(false);
    }
  }

  if (mode === "loading") return null;

  return (
    <section className="mt-[clamp(28px,4vh,44px)]">
      <p className="eyebrow mb-5">{BEARDCARE_COPY.sectionEyebrow}</p>
      <div className="rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.6vw,32px)]">
        {/* Intro */}
        {mode === "intro" && (
          <div>
            <h3 className="mb-2 font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.02em]">
              {BEARDCARE_COPY.sectionTitle}
            </h3>
            <p className="mb-6 max-w-[46ch] text-[15px] leading-relaxed text-graphite">
              {BEARDCARE_COPY.intro}
            </p>
            <button type="button" className="btn" onClick={() => setMode("form")}>
              <span className="btn-dot" />
              {BEARDCARE_COPY.cta}
            </button>
          </div>
        )}

        {/* Form */}
        {mode === "form" && (
          <div>
            <h3 className="mb-6 font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.02em]">
              {BEARDCARE_COPY.sectionTitle}
            </h3>
            <div className="grid gap-6">
              <div>
                <p className={HEADING}>{BEARDCARE_COPY.skinLabel}</p>
                <div className="flex flex-wrap gap-2.5">
                  {BEARDCARE_SKIN.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleIn("skin", o.value)}
                      className={`${PILL_BASE} ${answers.skin.includes(o.value) ? PILL_ON : PILL_OFF}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {BEARDCARE_FIELDS.map((f) => (
                <div key={f.id}>
                  <p className={HEADING}>{f.label}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {f.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setField(f.id, o.value)}
                        className={`${PILL_BASE} ${answers[f.id] === o.value ? PILL_ON : PILL_OFF}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <p className={HEADING}>{BEARDCARE_COPY.concernsLabel}</p>
                <div className="flex flex-wrap gap-2.5">
                  {BEARDCARE_CONCERNS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleIn("concerns", o.value)}
                      className={`${PILL_BASE} ${answers.concerns.includes(o.value) ? PILL_ON : PILL_OFF}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <p className="mt-5 text-[14px] text-bronze">{error}</p>}
            <div className="mt-7">
              <button
                type="button"
                className="btn"
                onClick={build}
                disabled={!ready || building}
              >
                <span className="btn-dot" />
                {building ? BEARDCARE_COPY.building : BEARDCARE_COPY.cta}
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        {mode === "tips" && tips && (
          <div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.02em]">
                {BEARDCARE_COPY.sectionTitle}
              </h3>
              <button
                type="button"
                onClick={() => setMode("form")}
                className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-stone transition-colors hover:text-bronze"
              >
                {BEARDCARE_COPY.update}
              </button>
            </div>
            <p className="mb-8 max-w-[62ch] text-[15px] leading-relaxed text-graphite">
              {tips.summary}
            </p>

            <div className="space-y-8">
              <div>
                <p className={HEADING}>{BEARDCARE_COPY.routineHeading}</p>
                <ol className="space-y-3">
                  {tips.routine.map((r, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-[11px] text-bone">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-[15px] leading-relaxed text-ink">
                          <span className="font-display font-bold">{r.step}.</span> {r.detail}
                        </p>
                        {r.cadence && (
                          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-bronze">
                            {r.cadence}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <p className={HEADING}>{BEARDCARE_COPY.productsHeading}</p>
                  <ul className="space-y-3.5">
                    {tips.products.map((p, i) => (
                      <li key={i}>
                        <p className="text-[14px] font-medium text-ink">{p.type}</p>
                        {p.ingredient && (
                          <p className="mt-0.5 font-mono text-[11px] tracking-[0.04em] text-stone">
                            {p.ingredient}
                          </p>
                        )}
                        <p className="mt-1 text-[13px] leading-relaxed text-graphite">{p.why}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={HEADING}>{BEARDCARE_COPY.stylingHeading}</p>
                  <ul className="space-y-2.5">
                    {tips.styling.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-graphite">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[var(--ink-08)] pt-6">
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
                <button type="button" className="btn" onClick={addAllToRoutine}>
                  <span className="btn-dot" />
                  Add to routine
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
