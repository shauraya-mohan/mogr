/**
 * Per-user rate limiting for the routes that call a paid API (OpenAI,
 * Photoroom). There's no auth-tier system yet, so this is the interim
 * guard against one signed-in user burning the budget — keyed off
 * auth.uid() via the check_rate_limit() Postgres function (see
 * supabase/migrations/0011_rate_limits.sql), so it holds across serverless
 * instances instead of resetting per cold start like an in-memory counter.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function withinRateLimit(
  supabase: SupabaseClient,
  route: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_route: route,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    // Fail open — a rate-limit outage shouldn't take the product down with it.
    console.error(`[rate-limit] ${route}:`, error.message);
    return true;
  }
  return data === true;
}

export function rateLimitedResponse() {
  return NextResponse.json(
    { error: "rate-limited", detail: "Too many requests — try again shortly." },
    { status: 429 },
  );
}
