/** Undertone quiz — questions, tally logic, and content strings. */

export type UndertoneSignal = "warm" | "cool" | "neutral";
export type Undertone = "warm" | "cool" | "neutral";

export interface UndertoneOption {
  value: UndertoneSignal;
  label: string;
}

export interface UndertoneQuestion {
  id: "sun" | "jewellery" | "veins";
  label: string;
  options: UndertoneOption[];
}

export const UNDERTONE_QUESTIONS: UndertoneQuestion[] = [
  {
    id: "sun",
    label: "In the sun, you…",
    options: [
      { value: "warm",    label: "Tan easily" },
      { value: "cool",    label: "Burn and go red" },
      { value: "neutral", label: "Somewhere in between" },
    ],
  },
  {
    id: "jewellery",
    label: "Gold or silver — which suits you better?",
    options: [
      { value: "warm",    label: "Gold" },
      { value: "cool",    label: "Silver" },
      { value: "neutral", label: "Both work for me" },
    ],
  },
  {
    id: "veins",
    label: "Look at the veins on your inner wrist",
    options: [
      { value: "warm",    label: "Greenish" },
      { value: "cool",    label: "Bluish / purple" },
      { value: "neutral", label: "Hard to tell" },
    ],
  },
];

export type UndertoneAnswers = Partial<Record<UndertoneQuestion["id"], UndertoneSignal>>;

/** Majority vote across answers; tie → neutral. */
export function tallyUndertone(answers: UndertoneAnswers): Undertone {
  const counts = { warm: 0, cool: 0, neutral: 0 };
  for (const v of Object.values(answers)) {
    if (v) counts[v]++;
  }
  if (counts.warm > counts.cool && counts.warm > counts.neutral) return "warm";
  if (counts.cool > counts.warm && counts.cool > counts.neutral) return "cool";
  return "neutral";
}

export const UNDERTONE_COPY = {
  eyebrow: "colours · one time",
  title: "Your colouring.",
  body: "Three taps. We use this to match colours to you — done once, never asked again.",
  cta: "Set my colours",
  saving: "Saving…",
} as const;
