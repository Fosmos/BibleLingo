"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProgressStore } from "@/store/useProgressStore";
import { AUTH_REQUIRED, LOCAL_USER_ID } from "@/lib/authConfig";
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
    if (AUTH_REQUIRED) {
      useAuthStore.getState().hydrate();
    } else {
      // Auth disabled: skip account lookup entirely and load the one local profile
      // directly, setting currentUserId so useProgressStore's persist() (which reads it
      // from useAuthStore) keeps saving normally.
      useProgressStore.getState().hydrate(LOCAL_USER_ID);
      useAuthStore.setState({ currentUserId: LOCAL_USER_ID, status: "signedIn" });
    }
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
