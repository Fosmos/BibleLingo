"use client";

import { useEffect, useRef } from "react";

// Requests a screen wake lock for as long as `active` is true — the one real mitigation a web
// page has against the single most common way SleepTimerView.tsx's playback actually stops:
// the OS auto-locking the screen after its own idle timeout, which kills the Web Speech API's
// synthesis on most mobile browsers. It does NOT help once the reader manually locks the
// screen or backgrounds the tab themselves — see SleepTimerView.tsx's own doc comment for why
// that's a real, unfixable-from-here limitation, not something this hook papers over.
// Best-effort and silently a no-op wherever the Wake Lock API isn't available at all (Safari
// has shipped it since 16.4; an older browser just doesn't get this protection) — never blocks
// playback or throws either way.
export function useWakeLock(active: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let cancelled = false;

    function requestLock() {
      navigator.wakeLock
        .request("screen")
        .then((lock) => {
          if (cancelled) {
            lock.release().catch(() => {});
            return;
          }
          lockRef.current = lock;
        })
        .catch(() => {
          // Declined (e.g. low-power mode) or called from a context the API refuses (not
          // visible, not user-activated) — playback still runs, just without this extra
          // protection against the screen auto-locking mid-session.
        });
    }

    requestLock();
    // The OS releases a wake lock on its own whenever the tab is hidden — re-request it once
    // the reader comes back to a still-active session, per the Wake Lock API's own documented
    // pattern, so briefly checking another app and returning doesn't leave playback unprotected
    // for the rest of the night.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !lockRef.current) requestLock();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
