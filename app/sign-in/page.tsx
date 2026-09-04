"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { LOCAL_USER_ID } from "@/lib/authConfig";
import { AuthScreen } from "@/components/auth/AuthScreen";

// Reachable from Profile's "Sign In" button even while AUTH_REQUIRED is false — creating or
// signing into a real local account is opt-in on top of the always-available anonymous local
// profile (see lib/authConfig.ts), not a replacement for it. Redirects back once signed into
// an actual account; staying on LOCAL_USER_ID (the anonymous profile) never redirects, since
// that's this page's own starting state, not a successful sign-in.
export default function SignInPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const currentUserId = useAuthStore((state) => state.currentUserId);

  useEffect(() => {
    if (status === "signedIn" && currentUserId && currentUserId !== LOCAL_USER_ID) {
      router.replace("/profile");
    }
  }, [status, currentUserId, router]);

  return <AuthScreen loading={false} />;
}
