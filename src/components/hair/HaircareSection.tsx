"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  HAIRCARE_FIELDS,
  HAIRCARE_CONCERNS,
  HAIRCARE_COPY,
  type HaircareAnswers,
} from "@/lib/hair/content";

interface Tips {
  summary: string;
  routine: { step: string; detail: string; cadence: string }[];
  products: { type: string; ingredient: string; why: string }[];
  styling: string[];
}

type Mode = "loading" | "intro" | "form" | "tips";

const PILL_BASE =
  "rounded-full border px-4 py-2 text-[14px] transition-colors";
const PILL_ON = "border-ink bg-ink text-bone";
const PILL_OFF = "border-[var(--ink-12)] text-graphite hover:border-bronze hover:text-ink";
const HEADING = "font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-3";

/**
 * Haircare routine — a self-contained section appended to the hair results.
 * Collects a short manual form, generates a text routine via /api/hair/haircare,
 * and persists it to hair_profiles.haircare. Independent of the styles UI.
 */
export default function HaircareSection() {
  const [mode, setMode] = useState<Mode>("loading");
  const [answers, setAnswers] = useState<HaircareAnswers>({ concerns: [] });
  const [tips, setTips] = useState<Tips | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        .from("hair_profiles")
        .select("haircare")
        .eq("user_id", user.id)
        .maybeSingle();
      const hc = data?.haircare as { answers?: HaircareAnswers; tips?: Tips } | null;
      if (hc?.tips) {
        setTips(hc.tips);
        if (hc.answers) setAnswers({ ...hc.answers, concerns: hc.answers.concerns ?? [] });
        setMode("tips");
      } else {
        setMode("intro");
      }
    })();
  }, []);

  function setField(id: "scalp" | "washFreq" | "heat", value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }
  function toggleConcern(value: string) {
    setAnswers((a) => ({
      ...a,
      concerns: a.concerns.includes(value)
        ? a.concerns.filter((c) => c !== value)
        : [...a.concerns, value],
    }));
  }

  const ready = !!answers.scalp && !!answers.washFreq && !!answers.heat;

  async function build() {
    setBuilding(true);
    setError(null);
    try {
      const res = await fetch("/api/hair/haircare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ haircare: answers }),
      });
      const json = await res.json();
      if (!res.ok || !json.tips) {
        setError("Couldn't build your routine — try again.");
        return;
      }
      setTips(json.tips);
      setMode("tips");
    } catch {
      setError("Couldn't build your routine — try again.");
    } finally {
      setBuilding(false);
    }
  }

  if (mode === "loading") return null;

  return (
    <section className="mt-[clamp(28px,4vh,44px)]">
      <p className="eyebrow mb-5">{HAIRCARE_COPY.sectionEyebrow}</p>
      <div className="rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.6vw,32px)]">
        {/* Intro */}
        {mode === "intro" && (
          <div>
            <h3 className="mb-2 font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.02em]">
              {HAIRCARE_COPY.sectionTitle}
            </h3>
            <p className="mb-6 max-w-[46ch] text-[15px] leading-relaxed text-graphite">
              {HAIRCARE_COPY.intro}
            </p>
            <button type="button" className="btn" onClick={() => setMode("form")}>
              <span className="btn-dot" />
              {HAIRCARE_COPY.cta}
            </button>
          </div>
        )}

        {/* Form */}
        {mode === "form" && (
          <div>
            <h3 className="mb-6 font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.02em]">
              {HAIRCARE_COPY.sectionTitle}
            </h3>
            <div className="grid gap-6">
              {HAIRCARE_FIELDS.map((f) => (
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
                <p className={HEADING}>{HAIRCARE_COPY.concernsLabel}</p>
                <div className="flex flex-wrap gap-2.5">
                  {HAIRCARE_CONCERNS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleConcern(o.value)}
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
                {building ? HAIRCARE_COPY.building : HAIRCARE_COPY.cta}
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        {mode === "tips" && tips && (
          <div>
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.02em]">
                {HAIRCARE_COPY.sectionTitle}
              </h3>
              <button
                type="button"
                onClick={() => setMode("form")}
                className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-stone transition-colors hover:text-bronze"
              >
                {HAIRCARE_COPY.update}
              </button>
            </div>
            <p className="mb-8 max-w-[62ch] text-[15px] leading-relaxed text-graphite">
              {tips.summary}
            </p>

            <div className="space-y-8">
              <div>
                <p className={HEADING}>{HAIRCARE_COPY.routineHeading}</p>
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
                  <p className={HEADING}>{HAIRCARE_COPY.productsHeading}</p>
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
                  <p className={HEADING}>{HAIRCARE_COPY.stylingHeading}</p>
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
          </div>
        )}
      </div>
    </section>
  );
}
