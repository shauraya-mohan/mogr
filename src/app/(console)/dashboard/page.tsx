"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DASHBOARD, type ReadField } from "@/lib/dashboard/data";
import { CATEGORY_ICONS } from "@/components/dashboard/icons";
import EditPreferences from "@/components/dashboard/EditPreferences";
import StreakCelebration from "@/components/dashboard/StreakCelebration";
import { createClient } from "@/lib/supabase/client";
import { useRoutine } from "@/lib/routine/useRoutine";
import { isDoneToday, todayISO, type TimeOfDay, type RoutineStep } from "@/lib/routine/content";
import { useStreak } from "@/lib/streak/useStreak";
import { fetchLooks } from "@/lib/wardrobe/looksStore";
import { SLOT_ORDER, type SavedLook } from "@/lib/wardrobe/looks";
import { pickForSeed, firstSentence } from "@/lib/wardrobe/dailyFit";

/** Built feature routes per category (others stay inert until built). */
const CATEGORY_HREF: Partial<Record<string, string>> = {
  skin: "/skin",
  hair: "/hair",
  "facial-hair": "/facial-hair",
  wardrobe: "/wardrobe",
};

const CARD =
  "rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.6vw,32px)]";

const READ_LABELS = ["Face shape", "Skin shade", "Hair", "Beard type"] as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-5">{children}</p>;
}

function Check({ checked, circle = false }: { checked: boolean; circle?: boolean }) {
  return (
    <span
      className={`grid h-5 w-5 shrink-0 place-items-center border transition-colors ${
        circle ? "rounded-full" : "rounded-[6px]"
      } ${checked ? "border-ink bg-ink text-bone" : "border-[var(--ink-12)] bg-transparent"}`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      )}
    </span>
  );
}

/** Clean day/night segmented toggle — a bronze pill slides between sun & moon. */
function DayNightToggle({ value, onChange }: { value: TimeOfDay; onChange: (t: TimeOfDay) => void }) {
  const pm = value === "pm";
  return (
    <div
      role="group"
      aria-label="Switch between morning and evening routine"
      className="relative inline-flex items-center rounded-full border border-[var(--ink-12)] bg-bone p-1"
    >
      <span
        aria-hidden
        className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-bronze transition-transform duration-500 ease-[var(--ease)] motion-reduce:transition-none ${
          pm ? "translate-x-7" : "translate-x-0"
        }`}
      />
      <button
        type="button"
        onClick={() => onChange("am")}
        aria-pressed={!pm}
        aria-label="Morning routine"
        className={`relative z-10 grid h-7 w-7 place-items-center rounded-full transition-colors duration-300 ease-[var(--ease)] ${
          pm ? "text-stone hover:text-ink" : "text-bone"
        }`}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange("pm")}
        aria-pressed={pm}
        aria-label="Evening routine"
        className={`relative z-10 grid h-7 w-7 place-items-center rounded-full transition-colors duration-300 ease-[var(--ease)] ${
          pm ? "text-bone" : "text-stone hover:text-ink"
        }`}
      >
        <MoonIcon />
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
    </svg>
  );
}

/** Hair ⇄ facial-hair switch — like the theme toggle: a single round button
 *  that swaps its icon on click. Opposite fills mark the two states (hair =
 *  solid bronze, facial hair = bronze outline). */
function FeatureToggle({
  value,
  onChange,
}: {
  value: "hair" | "facial_hair";
  onChange: (f: "hair" | "facial_hair") => void;
}) {
  const fh = value === "facial_hair";
  const Icon = CATEGORY_ICONS[fh ? "facial-hair" : "hair"];
  return (
    <button
      type="button"
      onClick={() => onChange(fh ? "hair" : "facial_hair")}
      aria-label={fh ? "Showing facial-hair routine, switch to hair" : "Showing hair routine, switch to facial hair"}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-300 ease-[var(--ease)] ${
        fh
          ? "border-bronze bg-transparent text-bronze hover:bg-bronze/10"
          : "border-transparent bg-bronze text-bone hover:brightness-110"
      }`}
    >
      <Icon className="h-[17px] w-[17px]" />
    </button>
  );
}

/** Grooming card — mirrors the skin card; a manual toggle swaps between the
 *  pinned hair and facial-hair steps. */
function GroomingCard({
  hair,
  facialHair,
  onToggle,
}: {
  hair: RoutineStep[];
  facialHair: RoutineStep[];
  onToggle: (s: RoutineStep) => void;
}) {
  const [feat, setFeat] = useState<"hair" | "facial_hair">("hair");
  const items = feat === "hair" ? hair : facialHair;
  const label = feat === "hair" ? "hair" : "facial-hair";
  const href = feat === "hair" ? "/hair" : "/facial-hair";

  return (
    <section className={CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="eyebrow">today&apos;s haircare</p>
        <FeatureToggle value={feat} onChange={setFeat} />
      </div>

      {items.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-graphite">
          No {label} steps pinned yet.{" "}
          <Link href={href} className="text-bronze transition-colors hover:text-ink">
            Build it →
          </Link>
        </p>
      ) : (
        <ul className="divide-y divide-[var(--ink-08)]">
          {items.map((s) => {
            const done = isDoneToday(s);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onToggle(s)}
                  className="flex w-full items-center gap-3.5 py-3 text-left"
                >
                  <Check checked={done} circle />
                  <span
                    className={`min-w-0 flex-1 text-[clamp(15px,1.6vw,17px)] leading-snug transition-colors duration-300 ease-[var(--ease)] ${
                      done ? "text-stone line-through" : "text-ink"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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

  // Real name + read. `null` = still loading (shows a skeleton, never the
  // "Arjun" placeholder). The localStorage read lives in the effect (not the
  // useState initializer) to avoid an SSR hydration mismatch.
  const [firstName, setFirstName] = useState<string | null>(null);
  const [read, setRead] = useState<ReadField[] | null>(null);
  useEffect(() => {
    const cachedName = localStorage.getItem("mogr-first-name");
    if (cachedName) setFirstName(cachedName); // instant correct name on repeat visits

    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [prof, hair, beard] = await Promise.all([
        supabase.from("profiles").select("full_name, face_shape, skin_shade").eq("id", user.id).maybeSingle(),
        supabase.from("hair_profiles").select("hair_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("facial_hair_profiles").select("growth, density").eq("user_id", user.id).maybeSingle(),
      ]);

      const fullName = prof.data?.full_name?.trim();
      if (fullName) {
        const fn = fullName.split(/\s+/)[0];
        setFirstName(fn);
        localStorage.setItem("mogr-first-name", fn);
      } else if (!cachedName) {
        setFirstName(""); // resolved, no name on file → stop the skeleton
      }

      // One clean word for the chip — density is the tidy enum (Sparse/Medium/
      // Dense); fall back to the first word of the growth phrase if it's missing.
      const beardVal = beard.data?.density ?? beard.data?.growth?.split(/[\s,]+/)[0] ?? null;
      setRead([
        { label: "Face shape", value: prof.data?.face_shape ?? "–" },
        { label: "Skin shade", value: prof.data?.skin_shade ?? "–" },
        { label: "Hair", value: hair.data?.hair_type ?? "–" },
        { label: "Beard type", value: beardVal ?? "–" },
      ]);
    })();
  }, []);

  // Today's skin routine = the pinned skin steps. Completion is daily-resetting
  // (isDoneToday); toggling persists to routine_steps. Morning/Evening is driven
  // by a day/night toggle that auto-defaults to the current time of day.
  const { steps: routineSteps, toggleDone } = useRoutine();
  const allPinned = (routineSteps ?? []).filter((s) => s.pinned);
  const skinPinned = allPinned.filter((s) => s.source === "skin");
  const hairPinned = allPinned.filter((s) => s.source === "hair");
  const facialHairPinned = allPinned.filter((s) => s.source === "facial_hair");

  const [tod, setTod] = useState<TimeOfDay>("am");
  useEffect(() => {
    setTod(new Date().getHours() < 17 ? "am" : "pm");
  }, []);
  const todItems = skinPinned.filter((s) => s.time_of_day === tod);

  // Streak: +1 the first time every pinned routine step is ticked for today;
  // a missed day resets it back to 1 the next time a full day is locked in.
  const { days: streakDays, note: streakNote, celebration, dismissCelebration } = useStreak(routineSteps);

  // Today's fit combo: one saved look, picked deterministically per day so
  // it's stable all day. Clicking it opens that exact look in the looks view.
  const [looks, setLooks] = useState<SavedLook[] | null>(null);
  useEffect(() => {
    fetchLooks().then(setLooks).catch(() => setLooks([]));
  }, []);
  const todayLook = looks ? pickForSeed(looks, todayISO()) : null;
  const fitPieces = todayLook
    ? SLOT_ORDER.map((slot) => todayLook.pieces.find((p) => p.slot === slot)).filter(
        (p): p is NonNullable<typeof p> => Boolean(p),
      )
    : [];

  return (
    <>
      <StreakCelebration days={streakDays} message={celebration} onClose={dismissCelebration} />

      {/* Greeting */}
      <header className="mb-[clamp(24px,4vh,40px)] flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">
            {greeting.day ? `${greeting.day}, let's lock in` : "let's lock in"}
          </p>
          <h1 className="font-display text-[clamp(34px,5vw,52px)] font-bold leading-[0.95] tracking-[-0.04em]">
            {greeting.word}
            {firstName === null ? (
              <>
                ,{" "}
                <span className="inline-block h-[0.72em] w-[2.4em] translate-y-[0.04em] animate-pulse rounded-md bg-[var(--ink-08)] align-baseline" />
              </>
            ) : firstName ? (
              <>, {firstName}</>
            ) : null}
            <span className="dot">.</span>
          </h1>
        </div>
        <div className="pt-1">
          <EditPreferences />
        </div>
      </header>

      <div className="space-y-[clamp(16px,2vw,22px)]">
        {/* Your read */}
        <section className={CARD}>
          <Eyebrow>your read</Eyebrow>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">
            {(read ?? READ_LABELS.map((label) => ({ label, value: "" }))).map((f) => (
              <div key={f.label}>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-stone">
                  {f.label}
                </p>
                {read === null ? (
                  <span className="mt-1 block h-[1.3em] w-[3.4em] animate-pulse rounded-md bg-[var(--ink-08)]" />
                ) : (
                  <p className="font-display text-[clamp(18px,2vw,24px)] tracking-[-0.02em] text-ink">
                    {f.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Routine + streak */}
        <div className="grid gap-[clamp(16px,2vw,22px)] lg:grid-cols-[1.5fr_1fr]">
          <section className={CARD}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <p className="eyebrow">today&apos;s skin routine</p>
              <DayNightToggle value={tod} onChange={setTod} />
            </div>

            {routineSteps === null ? (
              <ul className="space-y-3.5">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="h-5 w-2/3 animate-pulse rounded bg-[var(--ink-08)]" />
                ))}
              </ul>
            ) : skinPinned.length === 0 ? (
              <p className="text-[15px] leading-relaxed text-graphite">
                No skin steps pinned yet.{" "}
                <Link href="/skin" className="text-bronze transition-colors hover:text-ink">
                  Build your skin routine →
                </Link>
              </p>
            ) : todItems.length === 0 ? (
              <p className="text-[15px] leading-relaxed text-graphite">
                Nothing in your {tod === "am" ? "morning" : "evening"} routine yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--ink-08)]">
                {todItems.map((s) => {
                  const done = isDoneToday(s);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => toggleDone(s)}
                        className="flex w-full items-center gap-3.5 py-3 text-left"
                      >
                        <Check checked={done} />
                        <span
                          className={`min-w-0 flex-1 text-[clamp(15px,1.6vw,17px)] leading-snug transition-colors duration-300 ease-[var(--ease)] ${
                            done ? "text-stone line-through" : "text-ink"
                          }`}
                        >
                          {s.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <GroomingCard hair={hairPinned} facialHair={facialHairPinned} onToggle={toggleDone} />
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
          <section className={`${CARD} flex flex-col justify-center`}>
            <Eyebrow>streak</Eyebrow>
            {streakDays === null ? (
              <>
                <span className="block h-[clamp(46px,6vw,68px)] w-24 animate-pulse rounded-md bg-[var(--ink-08)]" />
                <span className="mt-3 block h-[15px] w-40 animate-pulse rounded bg-[var(--ink-08)]" />
              </>
            ) : (
              <>
                <p className="leading-none">
                  <span className="font-display text-[clamp(46px,6vw,68px)] font-bold tracking-[-0.04em] text-ink">
                    {streakDays}
                  </span>
                  <span className="ml-2.5 text-[16px] text-graphite">
                    {streakDays === 1 ? "day locked in" : "days locked in"}
                  </span>
                </p>
                <p className="mt-3 text-[15px] text-graphite">{streakNote}</p>
              </>
            )}
          </section>

          {looks === null ? (
            <section className={CARD}>
              <Eyebrow>today&apos;s fit combo</Eyebrow>
              <ul className="space-y-3.5">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-[var(--ink-08)]" />
                    <span className="h-4 w-2/3 animate-pulse rounded bg-[var(--ink-08)]" />
                  </li>
                ))}
              </ul>
            </section>
          ) : !todayLook ? (
            <section className={CARD}>
              <Eyebrow>today&apos;s fit combo</Eyebrow>
              <p className="text-[15px] leading-relaxed text-graphite">
                No looks saved yet.{" "}
                <Link href="/wardrobe/looks" className="text-bronze transition-colors hover:text-ink">
                  Save your first fit →
                </Link>
              </p>
            </section>
          ) : (
            <Link
              href={`/wardrobe/looks?look=${todayLook.id}`}
              className={`${CARD} block transition-colors hover:border-[rgba(176,122,60,0.5)]`}
            >
              <Eyebrow>today&apos;s fit combo</Eyebrow>
              <ul className="space-y-3.5">
                {fitPieces.map((p) => (
                  <li key={p.itemId} className="flex items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-[var(--ink-12)]"
                      style={{ background: p.tint }}
                    />
                    <span className="text-[16px] text-ink">{p.name}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-mono text-[12px] leading-relaxed text-stone">
                {firstSentence(todayLook.rationale) || `${todayLook.name} — an easy win today.`}
              </p>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
