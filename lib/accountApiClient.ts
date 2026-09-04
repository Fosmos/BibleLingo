import type { UserProgress } from "@/types";

export class AccountApiError extends Error {}

export interface PublicAccount {
  id: string;
  username: string;
  createdAt: string;
}

async function parseOrThrow(response: Response): Promise<unknown> {
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AccountApiError(json?.error ?? "Something went wrong talking to the server.");
  }
  return json;
}

export async function signUpRequest(username: string, password: string, seedProgress?: UserProgress): Promise<PublicAccount> {
  const response = await fetch("/api/account/sign-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, seedProgress }),
  });
  return (await parseOrThrow(response)) as PublicAccount;
}

export async function signInRequest(username: string, password: string): Promise<PublicAccount> {
  const response = await fetch("/api/account/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return (await parseOrThrow(response)) as PublicAccount;
}

// Server unreachable (e.g. a genuinely different network, not just a different LAN IP for
// this same server) degrades to null rather than throwing — callers fall back to whatever
// local copy they already have instead of blocking sign-in entirely.
export async function fetchServerProgress(userId: string): Promise<UserProgress | null> {
  try {
    const response = await fetch(`/api/account/progress?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return null;
    const json = await response.json();
    return (json.progress as UserProgress | null) ?? null;
  } catch {
    return null;
  }
}

// Fire-and-forget from useProgressStore's persist() — every local save also tries to push to
// the server so the next sign-in from a different origin picks up the latest, but a failure
// here never blocks or surfaces to the UI; the local save already succeeded.
export function syncProgressToServer(userId: string, progress: UserProgress): void {
  fetch("/api/account/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, progress }),
  }).catch(() => {});
}
