"use client";

import { useEffect, useState } from "react";

const MESSAGES: Record<string, string> = { ready: "Path ready — first lesson is up", done: "Lesson done — nice!" };

// A toast for arriving on the trail: `?toast=ready` (a path just set up) or `?toast=done` (back
// from a lesson). Shown once for 1.8s, then the query is dropped so a refresh doesn't repeat it.
export function useArrivalToast(): string | null {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("toast");
    if (!key || !MESSAGES[key]) return;
    params.delete("toast");
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
    const show = setTimeout(() => setText(MESSAGES[key]), 0);
    const hide = setTimeout(() => setText(null), 1800);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);
  return text;
}
