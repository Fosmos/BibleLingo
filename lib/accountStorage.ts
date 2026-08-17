import type { AccountRecord } from "@/types";

const ACCOUNTS_KEY = "verses:accounts";
const CURRENT_USER_KEY = "verses:currentUserId";

export function loadAccounts(): AccountRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AccountRecord[];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: AccountRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export function saveCurrentUserId(userId: string | null): void {
  if (typeof window === "undefined") return;
  if (userId === null) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    window.localStorage.setItem(CURRENT_USER_KEY, userId);
  }
}
