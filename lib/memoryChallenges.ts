// The small distractions the end-of-verse stages throw in (lib/learnSteps.ts): a payload to hold
// in mind while saying the verse (PayloadFlash.tsx/PayloadRecall.tsx), and math problems between
// sense lines (MathBreakCard.tsx). Pure — no React.

export interface PayloadColor {
  name: string;
  // The swatch's background — exact hex, since the theme remaps some of Tailwind's own named
  // colors (green, yellow, orange) to its earthy palette, too close to tell apart.
  swatch: string;
}

export const PAYLOAD_COLORS: PayloadColor[] = [
  { name: "Red", swatch: "bg-[#E5383B]" },
  { name: "Blue", swatch: "bg-[#2F6FED]" },
  { name: "Green", swatch: "bg-[#22A04B]" },
  { name: "Yellow", swatch: "bg-[#F5C518]" },
  { name: "Purple", swatch: "bg-[#8E44EC]" },
  { name: "Orange", swatch: "bg-[#F57C1F]" },
];

export interface Payload {
  number: number;
  color: PayloadColor;
}

const pick = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

// A number from 1 to 9 and one of the colors above.
export function makePayload(): Payload {
  return { number: pick(1, 9), color: PAYLOAD_COLORS[pick(0, PAYLOAD_COLORS.length - 1)] };
}

export interface MathProblem {
  text: string;
  answer: number;
}

// A sum, a difference (never below zero) or a times-table product — quick, but enough to pull
// the mind off the verse for a moment.
export function makeMathProblem(): MathProblem {
  const kind = pick(0, 2);
  if (kind === 0) {
    const a = pick(2, 12);
    const b = pick(2, 12);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (kind === 1) {
    const a = pick(6, 20);
    const b = pick(1, a - 1);
    return { text: `${a} − ${b}`, answer: a - b };
  }
  const a = pick(2, 9);
  const b = pick(2, 9);
  return { text: `${a} × ${b}`, answer: a * b };
}
