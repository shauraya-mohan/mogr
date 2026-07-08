/** Streak feature — shared types, date math, and messaging.
 *  A day counts as "locked in" once every pinned routine_step is completed_on
 *  that day. current_streak +1 when yesterday was locked in too; any gap
 *  resets it to 1 (never 0) the next time a full day is locked in. */

export interface StreakRow {
  current_streak: number;
  last_completed_on: string | null; // 'YYYY-MM-DD' (local) or null
}

/** Local date as YYYY-MM-DD, offset by `days` (negative = past). Matches the
 *  format routine_steps.completed_on already uses so the two line up. */
export function dateISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Given today's lock-in, what should the new streak count be? */
export function nextStreak(row: StreakRow): number {
  return row.last_completed_on === dateISO(-1) ? row.current_streak + 1 : 1;
}

/** Confident, qualitative, looksmax-flavoured copy — never shaming, always a
 *  concrete reason to keep going. Tiers loosely track habit-formation math
 *  (day 1, first week, first fortnight, first month, beyond). */
export function streakNote(days: number): string {
  if (days <= 0) return "Tick today's routine to start your streak.";
  if (days === 1) return "Day one, locked in. That's the hardest part done.";
  if (days < 7) return "Stacking days — the habit is forming.";
  if (days < 14) return "A full week locked in. This is routine now.";
  if (days < 30) return "Two weeks deep. Your skin's already thanking you.";
  if (days < 60) return "A month locked in. This is just who you are now.";
  return "Best run yet. Keep it going.";
}

/** Shown the moment every pinned step is ticked for the day — reuses the
 *  hero typewriter's own vocabulary (ascend / lock in / level up / glow up /
 *  mog) so the streak pop-up feels like the same brand voice, not a generic
 *  "nice job" toast. */
export const CELEBRATION_MESSAGES = [
  "Full routine, zero excuses. This is how you ascend.",
  "Locked in. That's the mog difference.",
  "Day secured — glow up in progress.",
  "Streak extended. Keep leveling up.",
] as const;

export function randomCelebration(): string {
  return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
}
