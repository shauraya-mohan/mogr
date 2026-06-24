"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FACIAL_HAIR_QUESTIONS, type Questionnaire } from "@/lib/facial-hair/content";

/**
 * Rendered inside the dashboard "Edit preferences" modal under the Facial hair
 * tab. Mirrors the Hair tab in components/dashboard/EditPreferences.tsx — pill
 * selectors + save, persisted to facial_hair_profiles.questionnaire.
 */
export default function FacialHairPreferences() {
  const [answers, setAnswers] = useState<Partial<Questionnaire>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("facial_hair_profiles")
        .select("questionnaire")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.questionnaire) setAnswers(data.questionnaire as Partial<Questionnaire>);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("facial_hair_profiles")
        .upsert({ user_id: user.id, questionnaire: answers });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <>
      <div className="grid gap-6">
        {FACIAL_HAIR_QUESTIONS.map((q) => (
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
      <div className="mt-8 flex items-center gap-4">
        <button type="button" onClick={save} disabled={saving} className="btn">
          <span className="btn-dot" />
          {saving ? "Saving…" : saved ? "Saved" : "Save preferences"}
        </button>
        <p className="font-mono text-[11px] leading-snug text-stone">
          Applies next time you regenerate your styles.
        </p>
      </div>
    </>
  );
}
