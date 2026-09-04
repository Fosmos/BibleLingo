"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { AUTH_REQUIRED } from "@/lib/authConfig";
import { ProgressInitializer } from "@/components/gamification/ProgressInitializer";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { AuthScreen } from "@/components/auth/AuthScreen";

interface AuthGateProps {
  children: ReactNode;
}

// Reading localStorage (accounts + which one was last signed in) is only possible after
// mount, so the store starts in "loading" until this one-time effect resolves it — guarded
// the same way ProgressInitializer's old one-time effect was, so React Strict Mode's
// double-invoke in development doesn't hydrate twice.
let hasHydrated = false;

export function AuthGate({ children }: AuthGateProps) {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (hasHydrated) return;
    hasHydrated = true;
    // useAuthStore.hydrate() itself handles both cases: restores a remembered real account
    // if one was signed into (regardless of AUTH_REQUIRED — a real sign-in should survive a
    // reload), and otherwise either lands signed out (AUTH_REQUIRED) or falls back to the
    // always-available anonymous local profile (AUTH_REQUIRED false — see
    // lib/authConfig.ts's LOCAL_USER_ID).
    useAuthStore.getState().hydrate();
  }, []);

  if (AUTH_REQUIRED && status !== "signedIn") {
    return <AuthScreen loading={status === "loading"} />;
  }

  return (
    <>
      <ProgressInitializer />
      <main className="flex flex-1 flex-col pb-20">{children}</main>
      <BottomTabBar />
    </>
  );
}
