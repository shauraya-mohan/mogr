"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UNDERTONE_QUESTIONS,
  UNDERTONE_COPY,
  tallyUndertone,
  type UndertoneAnswers,
} from "@/lib/wardrobe/undertone";

interface Props {
  onComplete: () => void;
}

export default function UndertoneQuiz({ onComplete }: Props) {
  const [answers, setAnswers] = useState<UndertoneAnswers>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = UNDERTONE_QUESTIONS.every((q) => answers[q.id] !== undefined);

  async function submit() {
    if (!allAnswered) return;
    setSaving(true);
    setError(null);
    try {
      const undertone = tallyUndertone(answers);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not signed in");
      const { error: err } = await supabase
        .from("profiles")
        .update({ undertone, undertone_source: "quiz" })
        .eq("id", user.id);
      if (err) throw err;
      onComplete();
    } catch {
      setError("Couldn't save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[580px]">
      <p className="eyebrow mb-4">{UNDERTONE_COPY.eyebrow}</p>
      <h1 className="font-display text-[clamp(34px,5.5vw,54px)] font-bold leading-[0.95] tracking-[-0.04em] mb-3">
        {UNDERTONE_COPY.title}
      </h1>
      <p className="text-graphite text-[clamp(15px,1.8vw,17px)] leading-relaxed max-w-[44ch] mb-10">
        {UNDERTONE_COPY.body}
      </p>

      <div className="grid gap-8">
        {UNDERTONE_QUESTIONS.map((q) => (
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

      <div className="mt-10">
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered || saving}
          className="btn btn-lg btn-bronze disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? UNDERTONE_COPY.saving : UNDERTONE_COPY.cta}
        </button>
      </div>
    </div>
  );
}
