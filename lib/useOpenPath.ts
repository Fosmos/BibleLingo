"use client";

import { useRouter } from "next/navigation";

// Opens an existing path where it left off — no progress reset, unlike lib/useGoToPath.ts's
// fresh start. The Mind Map path tab's "Continue" (see MindMapPathTab.tsx).
export function useOpenPath(): (key: string, version: string) => void {
  const router = useRouter();
  return (key, version) => {
    router.push(`/path/${encodeURIComponent(key)}?version=${encodeURIComponent(version)}`);
  };
}
