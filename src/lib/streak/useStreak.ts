"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDoneToday, type RoutineStep } from "@/lib/routine/content";
import { dateISO, nextStreak, randomCelebration, streakNote, type StreakRow } from "./content";

/**
 * Tracks the user's grooming-routine streak. Pass the full routine_steps list
 * (as loaded by useRoutine) — a day counts as locked in once every *pinned*
 * step is completed_on today. Recomputes and upserts user_streaks whenever
 * that flips true for the first time today. `days === null` while loading.
 */
export function useStreak(steps: RoutineStep[] | null) {
  const [row, setRow] = useState<StreakRow | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRow({ current_streak: 0, last_completed_on: null });
        return;
      }
      userIdRef.current = user.id;
      const { data } = await supabase
        .from("user_streaks")
        .select("current_streak, last_completed_on")
        .eq("user_id", user.id)
        .maybeSingle();
      setRow(data ?? { current_streak: 0, last_completed_on: null });
    })();
  }, []);

  useEffect(() => {
    if (!steps || !row) return;
    const pinned = steps.filter((s) => s.pinned);
    if (pinned.length === 0) return;

    const today = dateISO();
    if (row.last_completed_on === today) return; // already credited today
    if (!pinned.every(isDoneToday)) return;

    const updated: StreakRow = { current_streak: nextStreak(row), last_completed_on: today };
    setRow(updated);
    setCelebration(randomCelebration());

    const userId = userIdRef.current;
    if (!userId) return;
    const supabase = createClient();
    supabase.from("user_streaks").upsert({ user_id: userId, ...updated }).then();
  }, [steps, row]);

  return {
    days: row?.current_streak ?? null,
    note: streakNote(row?.current_streak ?? 0),
    celebration,
    dismissCelebration: () => setCelebration(null),
  };
}
