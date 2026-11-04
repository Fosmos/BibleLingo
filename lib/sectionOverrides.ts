// Whether the built-in section headings are used (UserProgress.builtInSectionsOff). Kept in step with
// the store (store/useProgressStore.ts), so every reader of section headings (lib/pericopeCache.ts) sees it.
let builtInOff = false;

export function setBuiltInSectionsOff(off: boolean | undefined): void {
  builtInOff = off ?? false;
}

// With the built-in headings off, every chapter has none ([]); undefined while they're on.
export function sectionOverride(): [] | undefined {
  return builtInOff ? [] : undefined;
}
