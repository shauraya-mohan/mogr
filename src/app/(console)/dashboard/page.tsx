"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DASHBOARD, type RoutineItem } from "@/lib/dashboard/data";
import { CATEGORY_ICONS } from "@/components/dashboard/icons";
import { createClient } from "@/lib/supabase/client";

/** Built feature routes per category (others stay inert until built). */
const CATEGORY_HREF: Partial<Record<string, string>> = { "facial-hair": undefined, hair: "/hair" };

const CARD =
  "rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.6vw,32px)]";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-5">{children}</p>;
}

function Check({ checked }: { checked: boolean }) {
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border transition-colors ${
        checked ? "border-ink bg-ink text-bone" : "border-[var(--ink-12)] bg-transparent"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      )}
    </span>
  );
}

export default function DashboardPage() {
  // Live greeting. Computed client-side to avoid hydration skew.
  const [greeting, setGreeting] = useState({ word: "Welcome", day: "" });
  useEffect(() => {
    const d = new Date();
    const h = d.getHours();
    const word = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
    const day = d.toLocaleDateString(undefined, { weekday: "long" });
    setGreeting({ word, day });
  }, []);

  // Real name from the user's profile (falls back to placeholder).
  const [firstName, setFirstName] = useState(DASHBOARD.user.name);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setFirstName(data.full_name.trim().split(/\s+/)[0]);
    });
  }, []);

  // Routine completion is local-only for now (resets on reload). Wire to a table later.
  const [routine, setRoutine] = useState<RoutineItem[]>(DASHBOARD.routine.map((r) => ({ ...r })));
  const toggle = (id: string) =>
    setRoutine((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));

  return (
    <>
      {/* Greeting */}
      <header className="mb-[clamp(24px,4vh,40px)]">
        <p className="eyebrow mb-3">
          {greeting.day ? `${greeting.day} — let's lock in` : "let's lock in"}
        </p>
        <h1 className="font-display text-[clamp(34px,5vw,52px)] font-bold leading-[0.95] tracking-[-0.04em]">
          {greeting.word}, {firstName}
          <span className="dot">.</span>
        </h1>
      </header>

      <div className="space-y-[clamp(16px,2vw,22px)]">
        {/* Your read */}
        <section className={CARD}>
          <Eyebrow>your read</Eyebrow>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">
            {DASHBOARD.read.map((f) => (
              <div key={f.label}>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-stone">
                  {f.label}
                </p>
                <p className="font-display text-[clamp(18px,2vw,24px)] tracking-[-0.02em] text-ink">
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Routine + streak */}
        <div className="grid gap-[clamp(16px,2vw,22px)] lg:grid-cols-[1.5fr_1fr]">
          <section className={CARD}>
            <Eyebrow>today&apos;s routine</Eyebrow>
            <ul className="divide-y divide-[var(--ink-08)]">
              {routine.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-center gap-3.5 py-3.5 text-left"
                  >
                    <Check checked={item.done} />
                    <span
                      className={`text-[clamp(15px,1.6vw,17px)] transition-colors ${
                        item.done ? "text-stone line-through" : "text-ink"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${CARD} flex flex-col justify-center`}>
            <Eyebrow>streak</Eyebrow>
            <p className="leading-none">
              <span className="font-display text-[clamp(46px,6vw,68px)] font-bold tracking-[-0.04em] text-ink">
                {DASHBOARD.streak.days}
              </span>
              <span className="ml-2.5 text-[16px] text-graphite">days locked in</span>
            </p>
            <p className="mt-3 text-[15px] text-graphite">{DASHBOARD.streak.note}</p>
          </section>
        </div>

        {/* Category quick cards */}
        <div className="grid grid-cols-2 gap-[clamp(12px,1.4vw,18px)] lg:grid-cols-4">
          {DASHBOARD.categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.key];
            const href = CATEGORY_HREF[cat.key];
            const cls =
              "group rounded-[18px] border border-[var(--ink-08)] bg-cloud p-[clamp(18px,2vw,24px)] text-left transition-colors hover:border-[rgba(176,122,60,0.5)]";
            const inner = (
              <>
                <Icon className="mb-7 h-6 w-6 text-graphite transition-colors group-hover:text-bronze" />
                <p className="font-display text-[clamp(18px,1.9vw,21px)] font-bold tracking-[-0.02em] text-ink">
                  {cat.title}
                </p>
                <p className="mt-1 font-mono text-[12px] leading-snug text-stone">
                  {cat.subtitle}
                </p>
              </>
            );
            return href ? (
              <Link key={cat.key} href={href} className={`block ${cls}`}>
                {inner}
              </Link>
            ) : (
              <button key={cat.key} type="button" className={cls}>
                {inner}
              </button>
            );
          })}
        </div>

        {/* Coaching + fit combo */}
        <div className="grid gap-[clamp(16px,2vw,22px)] lg:grid-cols-2">
          <section className={CARD}>
            <Eyebrow>coaching — next up</Eyebrow>
            <p className="text-[clamp(16px,1.6vw,18px)] leading-relaxed text-ink">
              {DASHBOARD.coaching}
            </p>
          </section>

          <section className={CARD}>
            <Eyebrow>today&apos;s fit combo</Eyebrow>
            <ul className="space-y-3.5">
              {DASHBOARD.fit.items.map((it) => (
                <li key={it.label} className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-[var(--ink-12)]"
                    style={{ background: it.color }}
                  />
                  <span className="text-[16px] text-ink">{it.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 font-mono text-[12px] leading-relaxed text-stone">
              {DASHBOARD.fit.note}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
