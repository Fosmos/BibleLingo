"use client";

import { useState } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

interface AuthScreenProps {
  loading: boolean;
}

export function AuthScreen({ loading }: AuthScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-title">Verses</h1>
        <p className="text-sm text-ink-muted">Memorize Scripture, one verse at a time.</p>
      </div>
      <div className="w-full max-w-xs rounded-2xl border border-line bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex rounded-full bg-mist p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-colors ${
              mode === "signin" ? "bg-white text-brand-600 shadow dark:bg-zinc-900" : "text-ink-muted"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition-colors ${
              mode === "signup" ? "bg-white text-brand-600 shadow dark:bg-zinc-900" : "text-ink-muted"
            }`}
          >
            Sign Up
          </button>
        </div>
        {mode === "signin" ? <SignInForm /> : <SignUpForm />}
      </div>
    </div>
  );
}
