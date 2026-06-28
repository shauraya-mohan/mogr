/** Routine feature — shared types, copy, and pure helpers.
 *  A routine_step is one step the user added (from a skin/hair/facial-hair
 *  routine, or custom). Completion is daily-resetting via completed_on. */

export type RoutineSource = "skin" | "hair" | "facial_hair" | "custom";
export type TimeOfDay = "am" | "pm";

export interface RoutineStep {
  id: string;
  source: RoutineSource;
  label: string;
  note: string | null; // short one-liner shown under the step
  time_of_day: TimeOfDay;
  sort_order: number;
  pinned: boolean;
  completed_on: string | null; // 'YYYY-MM-DD' (local) or null
}

export const SOURCE_LABEL: Record<RoutineSource, string> = {
  skin: "Skin",
  hair: "Hair",
  facial_hair: "Facial hair",
  custom: "Custom",
};

/** Map a routine source to the dashboard CategoryKey used by CATEGORY_ICONS. */
export const SOURCE_ICON_KEY: Record<RoutineSource, "skin" | "hair" | "facial-hair" | null> = {
  skin: "skin",
  hair: "hair",
  facial_hair: "facial-hair",
  custom: null,
};

export const TIME_LABEL: Record<TimeOfDay, string> = { am: "Morning", pm: "Evening" };

/** Local date as YYYY-MM-DD so "today" matches the user's calendar day. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function isDoneToday(step: { completed_on: string | null }): boolean {
  return !!step.completed_on && step.completed_on === todayISO();
}

/** Tidy a generated routine step into a short, checklist-friendly label.
 *  Cuts at a word boundary (no ellipsis) so it stays fully readable when it
 *  wraps on the routine page and the narrower dashboard column. */
export function shortenLabel(s: string, max = 32): string {
  const t = (s || "").replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  if (sp > 12) cut = cut.slice(0, sp);
  return cut.replace(/[\s,.;:–—-]+$/, "").trim();
}

/** A short subtext for the step description. Word-boundary trimmed, no ellipsis,
 *  so it reads as a complete phrase and wraps fully on the routine page. */
export function shortenDetail(s: string, max = 96): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  let cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  if (sp > 24) cut = cut.slice(0, sp);
  return cut.replace(/[\s,.;:–—-]+$/, "");
}

/** Find a stored step matching source + (already-shortened) label, scoped to a
 *  time-of-day when given (skin's AM and PM can share a step name). */
export function findStep(
  steps: RoutineStep[] | null,
  source: RoutineSource,
  label: string,
  timeOfDay?: TimeOfDay,
): RoutineStep | undefined {
  const key = label.toLowerCase();
  return (steps ?? []).find(
    (s) =>
      s.source === source &&
      s.label.toLowerCase() === key &&
      (timeOfDay ? s.time_of_day === timeOfDay : true),
  );
}

export const ROUTINE_COPY = {
  eyebrow: "your routine",
  title: "Routine",
  intro: "Pin steps to show them on your dashboard.",
  empty:
    "Your routine is empty. Open your skin, hair, or facial-hair results and add steps with the + button.",
  addToRoutine: "add to routine",
  morning: "morning",
  evening: "evening",
  addCustom: "Add a step",
} as const;
