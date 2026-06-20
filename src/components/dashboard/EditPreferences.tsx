"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HAIR_QUESTIONS, type Questionnaire } from "@/lib/hair/content";
import { CATEGORY_ICONS } from "@/components/dashboard/icons";
import type { CategoryKey } from "@/lib/dashboard/data";

const TABS: { key: CategoryKey; label: string }[] = [
  { key: "skin", label: "Skin" },
  { key: "hair", label: "Hair" },
  { key: "facial-hair", label: "Facial hair" },
  { key: "wardrobe", label: "Wardrobe" },
];

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function EditPreferences() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CategoryKey>("hair");
  const [hairAnswers, setHairAnswers] = useState<Partial<Questionnaire>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved hair selections when the panel opens.
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("hair_profiles")
        .select("questionnaire")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.questionnaire) setHairAnswers(data.questionnaire as Partial<Questionnaire>);
    })();
  }, [open]);

  // Esc to close + scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function saveHair() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("hair_profiles").upsert({ user_id: user.id, questionnaire: hairAnswers });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--ink-12)] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.1em] text-graphite transition-colors hover:border-bronze hover:text-ink"
      >
        <GearIcon />
        <span className="hidden sm:inline">Edit preferences</span>
        <span className="sm:hidden">Edit</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex max-h-[86vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[22px] border border-[var(--ink-12)] bg-bone shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-[clamp(20px,3vw,32px)] pt-[clamp(20px,3vw,28px)]">
              <div>
                <p className="eyebrow mb-2">preferences</p>
                <h2 className="font-display text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.03em]">
                  Edit preferences<span className="dot">.</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-stone transition-colors hover:bg-[var(--ink-08)] hover:text-ink"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex gap-1 border-b border-[var(--ink-08)] px-[clamp(14px,3vw,28px)]">
              {TABS.map((t) => {
                const Icon = CATEGORY_ICONS[t.key];
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-2 px-3 py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors ${
                      active ? "text-bronze" : "text-stone hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                    {active && (
                      <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-bronze" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-[clamp(20px,3vw,32px)] py-[clamp(22px,3vw,30px)]">
              {tab === "hair" ? (
                <>
                  <div className="grid gap-6">
                    {HAIR_QUESTIONS.map((q) => (
                      <div key={q.id}>
                        <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.14em] text-stone">
                          {q.label}
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {q.options.map((o) => {
                            const active = hairAnswers[q.id] === o.value;
                            return (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => setHairAnswers((a) => ({ ...a, [q.id]: o.value }))}
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
                    <button
                      type="button"
                      onClick={saveHair}
                      disabled={saving}
                      className="btn"
                    >
                      <span className="btn-dot" />
                      {saving ? "Saving…" : saved ? "Saved" : "Save preferences"}
                    </button>
                    <p className="font-mono text-[11px] leading-snug text-stone">
                      Applies next time you regenerate your styles.
                    </p>
                  </div>
                </>
              ) : (
                <ComingSoon tab={tab} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ComingSoon({ tab }: { tab: CategoryKey }) {
  const Icon = CATEGORY_ICONS[tab];
  const label = TABS.find((t) => t.key === tab)?.label ?? "";
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <Icon className="h-8 w-8 text-stone" />
      <p className="font-display text-[20px] font-bold tracking-[-0.02em]">
        {label}<span className="dot">.</span>
      </p>
      <p className="max-w-[36ch] text-[14px] leading-relaxed text-graphite">
        Editable {label.toLowerCase()} preferences are coming soon — this is where you&apos;ll
        tune what mogr recommends.
      </p>
    </div>
  );
}
