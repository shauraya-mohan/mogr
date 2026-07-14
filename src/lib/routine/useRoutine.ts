"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO, type RoutineStep, type RoutineSource, type TimeOfDay } from "./content";

const COLS = "id, source, label, note, time_of_day, sort_order, pinned, completed_on";

/**
 * Loads + mutates the signed-in user's routine_steps. Optimistic updates keep
 * the UI snappy; RLS scopes everything to the owner. `steps === null` = loading.
 */
export function useRoutine() {
  const [steps, setSteps] = useState<RoutineStep[] | null>(null);
  // Chains reorder() writes so rapid taps (the mobile up/down stepper fires
  // one reorder per tap) can't land on the DB out of network-response order
  // and clobber a newer order with a stale one.
  const reorderQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSteps([]);
      return;
    }
    const { data } = await supabase
      .from("routine_steps")
      .select(COLS)
      .eq("user_id", user.id)
      .order("time_of_day", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setSteps((data ?? []) as RoutineStep[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (source: RoutineSource, label: string, timeOfDay: TimeOfDay, note: string | null = null) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("routine_steps")
        .insert({ user_id: user.id, source, label, note, time_of_day: timeOfDay })
        .select(COLS)
        .single();
      if (data) setSteps((p) => [...(p ?? []), data as RoutineStep]);
    },
    [],
  );

  /** Bulk-add a whole routine at once (caller dedupes against current steps). */
  const addMany = useCallback(
    async (
      items: { source: RoutineSource; label: string; timeOfDay: TimeOfDay; note?: string | null }[],
    ) => {
      if (!items.length) return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("routine_steps")
        .insert(
          items.map((m) => ({
            user_id: user.id,
            source: m.source,
            label: m.label,
            note: m.note ?? null,
            time_of_day: m.timeOfDay,
          })),
        )
        .select(COLS);
      if (data) setSteps((p) => [...(p ?? []), ...(data as RoutineStep[])]);
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    setSteps((p) => (p ?? []).filter((s) => s.id !== id));
    const supabase = createClient();
    await supabase.from("routine_steps").delete().eq("id", id);
  }, []);

  const toggleDone = useCallback(async (step: RoutineStep) => {
    const completed_on = step.completed_on === todayISO() ? null : todayISO();
    setSteps((p) => (p ?? []).map((s) => (s.id === step.id ? { ...s, completed_on } : s)));
    const supabase = createClient();
    await supabase.from("routine_steps").update({ completed_on }).eq("id", step.id);
  }, []);

  const updateLabel = useCallback(async (id: string, label: string) => {
    setSteps((p) => (p ?? []).map((s) => (s.id === id ? { ...s, label } : s)));
    const supabase = createClient();
    await supabase.from("routine_steps").update({ label }).eq("id", id);
  }, []);

  const togglePinned = useCallback(async (step: RoutineStep) => {
    const pinned = !step.pinned;
    setSteps((p) => (p ?? []).map((s) => (s.id === step.id ? { ...s, pinned } : s)));
    const supabase = createClient();
    await supabase.from("routine_steps").update({ pinned }).eq("id", step.id);
  }, []);

  /** Reorder one group (a source + time_of_day) given its steps' new id order.
   *  Renumbers sort_order to match; the dashboard reads the same ordered query
   *  so its order tracks this. Permutes the group in place to keep other
   *  steps' positions untouched. */
  const reorder = useCallback(async (orderedIds: string[]) => {
    let next: { id: string; sort_order: number }[] = [];
    setSteps((prev) => {
      if (!prev) return prev;
      const ids = orderedIds.filter((id) => prev.some((s) => s.id === id));
      const idSet = new Set(ids);
      const reordered = ids.map((id, i) => ({ ...prev.find((s) => s.id === id)!, sort_order: i }));
      next = reordered.map((s) => ({ id: s.id, sort_order: s.sort_order }));
      let k = 0;
      return prev.map((s) => (idSet.has(s.id) ? reordered[k++] : s));
    });
    const supabase = createClient();
    const run = reorderQueueRef.current.then(() =>
      Promise.all(
        next.map(({ id, sort_order }) =>
          supabase.from("routine_steps").update({ sort_order }).eq("id", id),
        ),
      ),
    );
    reorderQueueRef.current = run;
    await run;
  }, []);

  return { steps, add, addMany, remove, updateLabel, toggleDone, togglePinned, reorder, reload: load };
}
