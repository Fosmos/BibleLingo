import type { MemorizedEntity } from "@/types";
import { boxDisplayNumber } from "@/lib/srs";
import { entitiesInScope, type SrsScope } from "@/lib/srsScopeStatus";

// One seal per spaced-review box (Box 1 → Box 6), from bronze up to diamond — shown in place of
// the "complete" check on a book or chapter, and on each verse in review (SrsSeal.tsx).
export interface SealTier {
  name: string;
  light: string;
  base: string;
  dark: string;
}

export const SEAL_TIERS: SealTier[] = [
  { name: "Bronze", light: "#F0B98A", base: "#C67F3E", dark: "#8A5427" },
  { name: "Silver", light: "#F7F8FA", base: "#BFC5CC", dark: "#7E8790" },
  { name: "Gold", light: "#FFE9A6", base: "#E2B33C", dark: "#A87A12" },
  { name: "Platinum", light: "#F1F5F9", base: "#C9D3E0", dark: "#8794A8" },
  { name: "Emerald", light: "#A7F3D0", base: "#34B27B", dark: "#1F7A52" },
  { name: "Diamond", light: "#E6FCFF", base: "#8EDBF0", dark: "#3FA9C9" },
];

// The seal (1–6, by display box) for everything in `scope` that's in spaced review: the LOWEST
// box among its ranges — a book is only as strong as its weakest passage. Null with none in review.
export function sealTier(entities: MemorizedEntity[], scope: SrsScope): number | null {
  const ranges = entitiesInScope(entities, scope);
  if (!ranges.length) return null;
  return Math.min(...ranges.map((entity) => Math.max(1, boxDisplayNumber(entity.srs.box))));
}
