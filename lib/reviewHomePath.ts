import type { MemorizedEntity, PathProgress } from "@/types";
import { activePathScope } from "@/lib/mindMapPathTarget";

// The path a memorized range was learned on — so its spaced review runs in that same path view.
// A path counts when its scope covers the range: a book path for its book, a chapter path for its
// chapter, a verse path whose verses overlap it. The focused path wins a tie, then the broadest
// (book, chapter, verse). Null when no path covers it (a verse added by hand) — callers fall back.
const KIND_ORDER = ["book", "chapter", "verse"];

function covers(key: string, entity: MemorizedEntity): boolean {
  const scope = activePathScope(key);
  if (!scope || scope.book !== entity.book) return false;
  if (scope.kind === "book") return true;
  if (scope.chapter !== entity.chapter) return false;
  if (scope.kind === "chapter") return true;
  return scope.verse !== undefined && scope.verse <= entity.endVerse && (scope.endVerse ?? scope.verse) >= entity.startVerse;
}

export function reviewHomePath(entity: MemorizedEntity, paths: Record<string, PathProgress>, activeKey: string | null): string | null {
  if (activeKey && paths[activeKey] && covers(activeKey, entity)) return activeKey;
  const candidates = Object.keys(paths).filter((key) => covers(key, entity));
  candidates.sort((a, b) => KIND_ORDER.indexOf(activePathScope(a)?.kind ?? "") - KIND_ORDER.indexOf(activePathScope(b)?.kind ?? ""));
  return candidates[0] ?? null;
}
