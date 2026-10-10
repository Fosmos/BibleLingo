"use client";

import { usePathname, useRouter } from "next/navigation";

// Opens an existing path where it left off — no progress reset, unlike lib/useGoToPath.ts's
// fresh start. The Mind Map path tab's "Continue" (see MindMapPathTab.tsx) — staying on the Mind
// Map tab when opened from there.
export function useOpenPath(): (key: string, version: string) => void {
  const router = useRouter();
  const onMap = usePathname().endsWith("/map");
  return (key, version) => {
    router.push(`/path/${encodeURIComponent(key)}${onMap ? "/map" : ""}?version=${encodeURIComponent(version)}`);
  };
}
