import type { PublicAccount } from "@/lib/accountApiClient";

const CURRENT_ACCOUNT_KEY = "verses:currentAccount";

// A local, origin-scoped cache of "which account is signed in here" — purely a same-origin
// convenience so a reload on the SAME origin auto-resumes without re-entering a password. The
// account itself (and its progress) lives server-side now (see lib/serverStore.ts and
// useAuthStore.ts) precisely because browser storage is scoped per-origin and this LAN dev
// setup's origin (a raw IP) changes whenever DHCP renews the lease — on a different origin
// this cache is simply empty and the reader signs in again, but their account and progress
// are still there once they do, unlike before when they'd look wiped.
export function loadCurrentAccount(): PublicAccount | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CURRENT_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicAccount;
  } catch {
    return null;
  }
}

export function saveCurrentAccount(account: PublicAccount | null): void {
  if (typeof window === "undefined") return;
  if (account === null) {
    window.localStorage.removeItem(CURRENT_ACCOUNT_KEY);
  } else {
    window.localStorage.setItem(CURRENT_ACCOUNT_KEY, JSON.stringify(account));
  }
}
