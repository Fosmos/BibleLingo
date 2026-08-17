import { create } from "zustand";
import type { AccountRecord } from "@/types";
import { loadAccounts, saveAccounts, loadCurrentUserId, saveCurrentUserId } from "@/lib/accountStorage";
import { generateSalt, hashPassword, verifyPassword } from "@/lib/auth";
import { consumeLegacyProgress, saveProgress } from "@/lib/storage";
import { useProgressStore } from "@/store/useProgressStore";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthState {
  accounts: AccountRecord[];
  currentUserId: string | null;
  status: AuthStatus;
}

interface AuthActions {
  hydrate: () => void;
  signUp: (username: string, password: string) => Promise<AuthResult>;
  signIn: (username: string, password: string) => Promise<AuthResult>;
  signOut: () => void;
}

type AuthStore = AuthState & AuthActions;

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// Local-only accounts: no server, no session tokens — signing in just means "load this
// account id's UserProgress into the progress store and remember the id for next launch."
export const useAuthStore = create<AuthStore>((set, get) => {
  function signInAs(account: AccountRecord) {
    useProgressStore.getState().hydrate(account.id);
    saveCurrentUserId(account.id);
    set({ currentUserId: account.id, status: "signedIn" });
  }

  return {
    accounts: [],
    currentUserId: null,
    status: "loading",

    hydrate: () => {
      const accounts = loadAccounts();
      set({ accounts });
      const account = accounts.find((candidate) => candidate.id === loadCurrentUserId());
      if (account) {
        signInAs(account);
      } else {
        set({ currentUserId: null, status: "signedOut" });
      }
    },

    signUp: async (username, password) => {
      const normalized = normalizeUsername(username);
      if (!normalized) return { ok: false, error: "Username is required." };
      if (password.length < 4) return { ok: false, error: "Password must be at least 4 characters." };

      const { accounts } = get();
      if (accounts.some((account) => account.username === normalized)) {
        return { ok: false, error: "That username is already taken." };
      }

      const isFirstAccountEver = accounts.length === 0;
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const account: AccountRecord = {
        id: crypto.randomUUID(),
        username: normalized,
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
      };

      // The very first account ever created inherits any pre-existing anonymous progress
      // from before accounts existed, instead of starting empty — must happen before
      // signInAs hydrates the store, since hydrate just reads whatever's saved under this
      // account's key (nothing, unless we write it here first).
      const legacyProgress = isFirstAccountEver ? consumeLegacyProgress() : null;
      if (legacyProgress) saveProgress(account.id, legacyProgress);

      const nextAccounts = [...accounts, account];
      saveAccounts(nextAccounts);
      set({ accounts: nextAccounts });
      signInAs(account);
      return { ok: true };
    },

    signIn: async (username, password) => {
      const normalized = normalizeUsername(username);
      const account = get().accounts.find((candidate) => candidate.username === normalized);
      if (!account || !(await verifyPassword(password, account.salt, account.passwordHash))) {
        return { ok: false, error: "Incorrect username or password." };
      }
      signInAs(account);
      return { ok: true };
    },

    signOut: () => {
      saveCurrentUserId(null);
      set({ currentUserId: null, status: "signedOut" });
    },
  };
});
