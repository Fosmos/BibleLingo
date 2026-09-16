"use client";

import { useRouter } from "next/navigation";
import { pathKey } from "@/lib/memorizationContent";

// Tapping a DIFFERENT book's own node in the Mind Map (see BookMindMap.tsx's onSwitchBook)
// switches the active path to it — same navigation a fresh pick through GuidedPathFlow.tsx
// would do, minus resetPathProgress, so an already-started book resumes rather than
// restarting. The currently ACTIVE book's own node never calls this — it just toggles its
// chapters open/closed as pure local state (see BookMindMap.tsx's toggleNode).
export function useSwitchBookPath(version: string): (bookName: string) => void {
  const router = useRouter();
  return (bookName) => {
    router.push(`/path/${encodeURIComponent(pathKey("book", bookName))}?version=${encodeURIComponent(version)}`);
  };
}
