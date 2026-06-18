/**
 * Dashboard data — ALL PLACEHOLDER for now.
 *
 * Everything here is hard-coded so the dashboard frontend renders standalone.
 * Wire each field to the real source later:
 *   - `user`        → Supabase auth + a `profiles` table (name, etc.)
 *   - `read`        → derived from the user's scan results
 *   - `routine`     → a `routines` / `routine_items` table (per-day completion)
 *   - `streak`      → computed from check-in history
 *   - `coaching`    → generated coaching output
 *   - `fit`         → wardrobe + styling engine
 */

export interface RoutineItem {
  id: string;
  label: string;
  done: boolean;
}

export type CategoryKey = "skin" | "hair" | "facial-hair" | "wardrobe";

export interface CategoryCard {
  key: CategoryKey;
  title: string;
  subtitle: string;
}

export interface ReadField {
  label: string;
  value: string;
}

export interface FitItem {
  label: string;
  /** Swatch colour (hex). */
  color: string;
}

export const NAV_ITEMS = [
  "dashboard",
  "scans",
  "routine",
  "your looks",
  "wardrobe",
  "progress",
] as const;

export const DASHBOARD = {
  user: { name: "Arjun", initials: "AK" },

  read: [
    { label: "Face shape", value: "Oval" },
    { label: "Skin shade", value: "Medium" },
    { label: "Hair", value: "Wavy, medium" },
    { label: "Beard type", value: "Full" },
  ] as ReadField[],

  routine: [
    { id: "cleanser", label: "Gentle gel cleanser", done: true },
    { id: "serum", label: "Niacinamide serum", done: true },
    { id: "moisturiser", label: "Lightweight moisturiser", done: false },
    { id: "spf", label: "SPF 50 — don't skip", done: false },
  ] as RoutineItem[],

  streak: { days: 12, note: "Best run yet. Keep it going." },

  categories: [
    { key: "skin", title: "Skin", subtitle: "Scan & get your routine" },
    { key: "hair", title: "Hair", subtitle: "Try cuts on your face" },
    { key: "facial-hair", title: "Facial hair", subtitle: "Find your beard style" },
    { key: "wardrobe", title: "Wardrobe", subtitle: "Add items to style" },
  ] as CategoryCard[],

  coaching:
    "Strong jawline and clear skin — that's working for you. Dialing in consistent SPF and trying a textured crop would sharpen the whole look. Scan your beard to round out your profile.",

  fit: {
    items: [
      { label: "Olive overshirt", color: "#6B6B3A" },
      { label: "White crew tee", color: "#EDEAE0" },
      { label: "Indigo straight jeans", color: "#27324E" },
    ] as FitItem[],
    note: "Earthy tones suit you — easy win today.",
  },
} as const;
