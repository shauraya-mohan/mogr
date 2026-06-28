"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRoutine } from "@/lib/routine/useRoutine";
import {
  ROUTINE_COPY,
  type RoutineStep,
  type RoutineSource,
  type TimeOfDay,
} from "@/lib/routine/content";
import { CATEGORY_ICONS } from "@/components/dashboard/icons";

type Ctl = ReturnType<typeof useRoutine>;

interface CardDef {
  source: RoutineSource;
  title: string;
  iconKey: "skin" | "hair" | "facial-hair" | null;
}
const CARDS: CardDef[] = [
  { source: "skin", title: "Skincare", iconKey: "skin" },
  { source: "hair", title: "Haircare", iconKey: "hair" },
  { source: "facial_hair", title: "Facial hair", iconKey: "facial-hair" },
  { source: "custom", title: "Custom", iconKey: null },
];

export default function RoutinePage() {
  const ctl = useRoutine();
  const { steps } = ctl;
  const [editingCard, setEditingCard] = useState<RoutineSource | null>(null);
  const [subtitle, setSubtitle] = useState<{ hair: string | null; growth: string | null }>({
    hair: null,
    growth: null,
  });

  // Card subtitles come from the shared reads (hair type, beard growth).
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: hp }, { data: fp }] = await Promise.all([
        supabase.from("hair_profiles").select("hair_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("facial_hair_profiles").select("growth").eq("user_id", user.id).maybeSingle(),
      ]);
      setSubtitle({ hair: hp?.hair_type ?? null, growth: fp?.growth ?? null });
    })();
  }, []);

  if (steps === null) {
    return <p className="font-mono text-[13px] text-stone">Loading…</p>;
  }

  const pinnedCount = steps.filter((s) => s.pinned).length;
  const activeCards = CARDS.filter((c) => steps.some((s) => s.source === c.source));
  // Skin spans full width (it has its own AM/PM split); the single-list cards
  // (hair / facial hair / custom) pair up side by side.
  const skinCard = activeCards.find((c) => c.source === "skin");
  const otherCards = activeCards.filter((c) => c.source !== "skin");

  function subtitleFor(source: RoutineSource): string {
    if (source === "skin") return "Morning + Evening";
    if (source === "hair") return subtitle.hair ?? "Your hair";
    if (source === "facial_hair") return subtitle.growth ?? "Your beard";
    return "Your own steps";
  }

  const renderCard = (card: CardDef) => (
    <Card
      key={card.source}
      card={card}
      subtitle={subtitleFor(card.source)}
      steps={steps.filter((s) => s.source === card.source)}
      editing={editingCard === card.source}
      onToggleEdit={() => setEditingCard((cur) => (cur === card.source ? null : card.source))}
      ctl={ctl}
    />
  );

  return (
    <>
      <header className="mb-[clamp(8px,1.5vh,16px)] flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">{ROUTINE_COPY.eyebrow}</p>
          <h1 className="font-display text-[clamp(34px,5vw,52px)] font-bold leading-[0.95] tracking-[-0.04em]">
            Your routines<span className="dot">.</span>
          </h1>
        </div>
        {steps.length > 0 && (
          <span className="mt-1 inline-flex shrink-0 items-center gap-2.5 rounded-full border border-[var(--ink-12)] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.1em] text-graphite">
            <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
            {pinnedCount} {pinnedCount === 1 ? "step" : "steps"} on your dashboard
          </span>
        )}
      </header>

      {steps.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <p className="mb-[clamp(22px,3.5vh,40px)] max-w-[58ch] text-[15px] leading-relaxed text-graphite">
            Hit <span className="text-ink">+</span> to pin a step to your dashboard, drag the
            handle to reorder, and use <span className="text-ink">edit</span> to rename or remove.
          </p>
          <div className="space-y-[clamp(16px,2.4vw,24px)]">
            {skinCard && renderCard(skinCard)}
            {otherCards.length > 0 && (
              <div className="grid items-start gap-[clamp(16px,2.4vw,24px)] min-[900px]:grid-cols-2">
                {otherCards.map(renderCard)}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

const CARD_CLS =
  "rounded-[20px] border border-[var(--ink-08)] bg-cloud p-[clamp(20px,2.8vw,34px)]";

function Card({
  card,
  subtitle,
  steps,
  editing,
  onToggleEdit,
  ctl,
}: {
  card: CardDef;
  subtitle: string;
  steps: RoutineStep[];
  editing: boolean;
  onToggleEdit: () => void;
  ctl: Ctl;
}) {
  const Icon = card.iconKey ? CATEGORY_ICONS[card.iconKey] : null;

  return (
    <section className={CARD_CLS}>
      {/* Card header */}
      <div className="mb-[clamp(18px,2.4vw,28px)] flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-[var(--ink-08)] bg-bone text-bronze dark:border-bronze/20 dark:bg-bronze/10">
          {Icon ? <Icon className="h-5 w-5" /> : <span className="h-2 w-2 rounded-full bg-bronze" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[clamp(20px,2.2vw,26px)] font-bold leading-tight tracking-[-0.02em] text-ink">
            {card.title}
          </h2>
          <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-stone">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleEdit}
          className="shrink-0 font-mono text-[12px] uppercase tracking-[0.14em] text-stone transition-colors duration-300 ease-[var(--ease)] hover:text-bronze"
        >
          {editing ? "done" : "edit"}
        </button>
      </div>

      {/* Body */}
      {card.source === "skin" ? (
        <div className="grid gap-x-[clamp(24px,4vw,56px)] gap-y-2 md:grid-cols-2">
          <Column label="Morning" icon={<SunIcon />} time="am" source={card.source} steps={steps} editing={editing} ctl={ctl} />
          <Column label="Evening" icon={<MoonIcon />} time="pm" source={card.source} steps={steps} editing={editing} ctl={ctl} />
        </div>
      ) : (
        <div>
          <StepList steps={steps} editing={editing} ctl={ctl} />
          <AddStep onAdd={(label, note) => ctl.add(card.source, label, "am", note)} />
        </div>
      )}
    </section>
  );
}

function Column({
  label,
  icon,
  time,
  source,
  steps,
  editing,
  ctl,
}: {
  label: string;
  icon: React.ReactNode;
  time: TimeOfDay;
  source: RoutineSource;
  steps: RoutineStep[];
  editing: boolean;
  ctl: Ctl;
}) {
  const items = steps.filter((s) => s.time_of_day === time);
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5 border-b border-[var(--ink-08)] pb-3">
        <span className="text-bronze">{icon}</span>
        <h3 className="font-display text-[17px] font-bold tracking-[-0.01em] text-ink">{label}</h3>
      </div>
      <StepList steps={items} editing={editing} ctl={ctl} />
      <AddStep onAdd={(lbl, note) => ctl.add(source, lbl, time, note)} />
    </div>
  );
}

function StepList({ steps, editing, ctl }: { steps: RoutineStep[]; editing: boolean; ctl: Ctl }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (steps.length === 0) {
    return <p className="py-3 font-mono text-[11px] tracking-[0.04em] text-stone">Nothing here yet.</p>;
  }

  function reset() {
    setDragId(null);
    setOverId(null);
  }

  function drop(targetId: string) {
    if (dragId && dragId !== targetId) {
      const ids = steps.map((s) => s.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from !== -1 && to !== -1) {
        ids.splice(from, 1);
        ids.splice(to, 0, dragId);
        ctl.reorder(ids);
      }
    }
    reset();
  }

  return (
    <ul>
      {steps.map((s) => (
        <Row
          key={s.id}
          step={s}
          editing={editing}
          ctl={ctl}
          dragging={dragId === s.id}
          over={overId === s.id && dragId !== s.id}
          onDragStart={() => setDragId(s.id)}
          onDragEnter={() => dragId && setOverId(s.id)}
          onDrop={() => drop(s.id)}
          onDragEnd={reset}
        />
      ))}
    </ul>
  );
}

function Row({
  step,
  editing,
  ctl,
  dragging,
  over,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
}: {
  step: RoutineStep;
  editing: boolean;
  ctl: Ctl;
  dragging: boolean;
  over: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const [name, setName] = useState(step.label);

  return (
    <li
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-start gap-3 border-b border-[var(--ink-08)] py-3.5 last:border-0 transition-[opacity,box-shadow] duration-200 ease-[var(--ease)] ${
        dragging ? "opacity-40" : "opacity-100"
      } ${over ? "shadow-[inset_0_2px_0_0_var(--bronze)]" : ""}`}
    >
      {/* Drag handle */}
      <span
        draggable
        onDragStart={onDragStart}
        aria-label="Drag to reorder"
        className="mt-1 shrink-0 cursor-grab text-stone transition-colors duration-300 ease-[var(--ease)] hover:text-bronze active:cursor-grabbing"
      >
        <GripIcon />
      </span>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const t = name.trim();
              if (t && t !== step.label) ctl.updateLabel(step.id, t);
              else setName(step.label);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="w-full bg-transparent text-[15px] font-medium text-ink outline-none"
          />
        ) : (
          <p className="text-[15px] font-medium leading-snug text-ink">{step.label}</p>
        )}
        {step.note && (
          <p className="mt-0.5 text-[13px] leading-snug text-stone">{step.note}</p>
        )}
      </div>

      {editing ? (
        <button
          type="button"
          onClick={() => ctl.remove(step.id)}
          aria-label="Remove step"
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-stone transition-colors duration-300 ease-[var(--ease)] hover:text-bronze"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ) : (
        <PinButton pinned={step.pinned} onToggle={() => ctl.togglePinned(step)} />
      )}
    </li>
  );
}

/** Pin-to-dashboard control: ghost "+" → flashes a bronze "✓" on pin → settles
 *  to a filled bronze "−" (tap to unpin). Bronze is the single accent here. */
function PinButton({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) {
  const [flash, setFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function click() {
    if (!pinned) {
      onToggle();
      setFlash(true);
      timer.current = setTimeout(() => setFlash(false), 1000);
    } else {
      if (timer.current) clearTimeout(timer.current);
      setFlash(false);
      onToggle();
    }
  }

  const state = flash ? "check" : pinned ? "minus" : "plus";
  const filled = state !== "plus";

  return (
    <button
      type="button"
      onClick={click}
      aria-label={pinned ? "Remove from dashboard" : "Pin to dashboard"}
      aria-pressed={pinned}
      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300 ease-[var(--ease)] ${
        filled
          ? "border-transparent bg-bronze text-bone"
          : "border-[var(--ink-12)] text-stone hover:border-bronze hover:text-bronze"
      }`}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {state === "check" ? (
          <path d="M20 6L9 17l-5-5" />
        ) : state === "minus" ? (
          <path d="M5 12h14" />
        ) : (
          <path d="M12 5v14M5 12h14" />
        )}
      </svg>
    </button>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="4" r="1.3" />
      <circle cx="11" cy="4" r="1.3" />
      <circle cx="5" cy="8" r="1.3" />
      <circle cx="11" cy="8" r="1.3" />
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="11" cy="12" r="1.3" />
    </svg>
  );
}

function AddStep({ onAdd }: { onAdd: (label: string, note: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");

  // Single commit path (blur OR the add button) so a step can't be added twice.
  function commit() {
    const t = val.trim();
    if (t) onAdd(t, null);
    setVal("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--ink-12)] py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-stone transition-colors duration-300 ease-[var(--ease)] hover:border-bronze hover:text-ink"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {ROUTINE_COPY.addCustom}
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-[var(--ink-12)] px-3.5 py-2.5">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setVal("");
            setOpen(false);
          }
        }}
        placeholder="Name a step…"
        className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-stone"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={commit}
        className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-bronze transition-colors hover:text-ink"
      >
        add
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--ink-12)] p-[clamp(28px,5vw,52px)] text-center">
      <p className="mb-2 font-display text-[clamp(20px,2.4vw,26px)] font-bold tracking-[-0.02em]">
        Build your routine<span className="dot">.</span>
      </p>
      <p className="mx-auto mb-7 max-w-[44ch] text-[15px] leading-relaxed text-graphite">
        {ROUTINE_COPY.empty}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <RouteChip href="/skin" label="Skin" k="skin" />
        <RouteChip href="/hair" label="Hair" k="hair" />
        <RouteChip href="/facial-hair" label="Facial hair" k="facial-hair" />
      </div>
    </div>
  );
}

function RouteChip({ href, label, k }: { href: string; label: string; k: "skin" | "hair" | "facial-hair" }) {
  const Icon = CATEGORY_ICONS[k];
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--ink-12)] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.1em] text-graphite transition-colors duration-300 ease-[var(--ease)] hover:border-bronze hover:text-ink"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
    </svg>
  );
}
