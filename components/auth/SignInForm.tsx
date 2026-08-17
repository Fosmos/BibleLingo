"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { TAP_SCALE } from "@/lib/motionTokens";

const FIELD_CLASS =
  "rounded-xl border border-line p-3 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

export function SignInForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await useAuthStore.getState().signIn(username, password);
    setSubmitting(false);
    if (!result.ok) setError(result.error ?? "Something went wrong.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Username"
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Username"
        className={FIELD_CLASS}
      />
      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        type="password"
        placeholder="Password"
        aria-label="Password"
        className={FIELD_CLASS}
      />
      {error && <p className="text-sm text-heart-600">{error}</p>}
      <motion.button
        type="submit"
        whileTap={TAP_SCALE}
        disabled={submitting || !username || !password}
        className="rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign In"}
      </motion.button>
    </form>
  );
}
