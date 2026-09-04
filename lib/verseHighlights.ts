import type { CustomClauseRole } from "@/types";

// The Orientation stage has no preset role catalog — every role is named and colored by the
// reader themselves (see components/drills/CustomRoleEditor.tsx), scoped per Bible book and
// persisted via useProgressStore's customClauseRoles so a role defined once keeps showing up
// as a quick-select option for every later lesson in that same book (see
// store/customClauseRoleActions.ts). Each annotation keeps its own snapshot of the role
// (rather than just an id) so every consumer that already threads WordAnnotation around
// (AnnotatedVerseWord, ClauseCard, ...) renders it with no extra prop or store lookup needed.
export interface WordAnnotation {
  role?: CustomClauseRole;
}

export type WordAnnotationMap = Record<number, WordAnnotation>;

// Curated color options for a reader-defined role (see CustomRoleEditor) — not a free hex
// picker, since Tailwind needs every class name it ships to be statically visible at build
// time.
export const CUSTOM_ROLE_COLOR_OPTIONS: { name: string; swatchClassName: string; washClassName: string; blockClassName: string }[] = [
  { name: "Red", swatchClassName: "bg-red-600", washClassName: "bg-red-500/10 dark:bg-red-500/15", blockClassName: "bg-red-500/10 dark:bg-red-500/15 border-l-4 border-red-600" },
  { name: "Orange", swatchClassName: "bg-orange-500", washClassName: "bg-orange-500/10 dark:bg-orange-500/15", blockClassName: "bg-orange-500/10 dark:bg-orange-500/15 border-l-4 border-orange-500" },
  { name: "Amber", swatchClassName: "bg-amber-500", washClassName: "bg-amber-500/10 dark:bg-amber-500/15", blockClassName: "bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-amber-500" },
  { name: "Lime", swatchClassName: "bg-lime-600", washClassName: "bg-lime-500/10 dark:bg-lime-500/15", blockClassName: "bg-lime-500/10 dark:bg-lime-500/15 border-l-4 border-lime-600" },
  { name: "Teal", swatchClassName: "bg-teal-600", washClassName: "bg-teal-500/10 dark:bg-teal-500/15", blockClassName: "bg-teal-500/10 dark:bg-teal-500/15 border-l-4 border-teal-600" },
  { name: "Cyan", swatchClassName: "bg-cyan-600", washClassName: "bg-cyan-500/10 dark:bg-cyan-500/15", blockClassName: "bg-cyan-500/10 dark:bg-cyan-500/15 border-l-4 border-cyan-600" },
  { name: "Sky", swatchClassName: "bg-sky-600", washClassName: "bg-sky-500/10 dark:bg-sky-500/15", blockClassName: "bg-sky-500/10 dark:bg-sky-500/15 border-l-4 border-sky-600" },
  { name: "Indigo", swatchClassName: "bg-indigo-600", washClassName: "bg-indigo-500/10 dark:bg-indigo-500/15", blockClassName: "bg-indigo-500/10 dark:bg-indigo-500/15 border-l-4 border-indigo-600" },
  { name: "Violet", swatchClassName: "bg-violet-600", washClassName: "bg-violet-500/10 dark:bg-violet-500/15", blockClassName: "bg-violet-500/10 dark:bg-violet-500/15 border-l-4 border-violet-600" },
  { name: "Fuchsia", swatchClassName: "bg-fuchsia-600", washClassName: "bg-fuchsia-500/10 dark:bg-fuchsia-500/15", blockClassName: "bg-fuchsia-500/10 dark:bg-fuchsia-500/15 border-l-4 border-fuchsia-600" },
  { name: "Rose", swatchClassName: "bg-rose-600", washClassName: "bg-rose-500/10 dark:bg-rose-500/15", blockClassName: "bg-rose-500/10 dark:bg-rose-500/15 border-l-4 border-rose-600" },
  { name: "Stone", swatchClassName: "bg-stone-500", washClassName: "bg-stone-500/10 dark:bg-stone-400/15", blockClassName: "bg-stone-500/10 dark:bg-stone-400/15 border-l-4 border-stone-500" },
];

// AnnotatedVerseWord/ClauseCard just want {label, swatchClassName, washClassName,
// blockClassName} — this is the one place that reads an annotation's role, so if the shape
// ever needs to change again, only this function (and CustomClauseRole itself) has to move.
export type ResolvedRoleTheme = Pick<CustomClauseRole, "label" | "swatchClassName" | "washClassName" | "blockClassName">;

export function themeForAnnotation(annotation?: WordAnnotation): ResolvedRoleTheme | undefined {
  return annotation?.role;
}

// Re-keys a slice of a larger annotation map down to a batch's own local word indices — the
// Learn flow's Orientation stage annotates the whole day's words at once, but each later
// batch stage only shows a subset of them, indexed from 0 within its own joined text.
export function sliceWordAnnotations(annotations: WordAnnotationMap, offset: number, length: number): WordAnnotationMap {
  const sliced: WordAnnotationMap = {};
  for (let i = 0; i < length; i++) {
    const entry = annotations[offset + i];
    if (entry) sliced[i] = entry;
  }
  return sliced;
}
