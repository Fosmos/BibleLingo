import { create } from "zustand";
import { loadCurrentAccount, saveCurrentAccount } from "@/lib/accountStorage";
import { signUpRequest, signInRequest, fetchServerProgress, AccountApiError, type PublicAccount } from "@/lib/accountApiClient";
import { loadProgress, saveProgress } from "@/lib/storage";
import { AUTH_REQUIRED, LOCAL_USER_ID } from "@/lib/authConfig";
import { useProgressStore } from "@/store/useProgressStore";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthState {
  currentUserId: string | null;
  currentUsername: string | null;
  status: AuthStatus;
}

interface AuthActions {
  hydrate: () => Promise<void>;
  signUp: (username: string, password: string) => Promise<AuthResult>;
  signIn: (username: string, password: string) => Promise<AuthResult>;
  signOut: () => void;
}

type AuthStore = AuthState & AuthActions;

// Accounts and their progress live server-side now (see lib/serverStore.ts) — browser
// storage is scoped per-origin, and this app's typical dev setup (a raw LAN IP that changes
// whenever DHCP renews the lease) meant every IP change looked like signing in on a brand
// new, empty device. Signing in now means "verify with the server, fetch this account's
// server-side progress, and adopt it as this tab's live progress" — the only thing still
// local is a same-origin cache of *which* account was last signed into (see
// lib/accountStorage.ts), so a reload on the SAME origin auto-resumes without re-entering a
// password, but a different origin just asks for the password again rather than losing data.
export const useAuthStore = create<AuthStore>((set, get) => {
  async function signInAs(account: PublicAccount) {
    const serverProgress = await fetchServerProgress(account.id);
    if (serverProgress) {
      useProgressStore.setState(serverProgress);
      saveProgress(account.id, serverProgress);
    } else {
      // Server unreachable, or (belt-and-suspenders) nothing saved yet — fall back to
      // whatever's cached locally for this account.
      useProgressStore.getState().hydrate(account.id);
    }
    saveCurrentAccount(account);
    set({ currentUserId: account.id, currentUsername: account.username, status: "signedIn" });
  }

  return {
    currentUserId: null,
    currentUsername: null,
    status: "loading",

    hydrate: async () => {
      const cached = loadCurrentAccount();
      if (cached) {
        await signInAs(cached);
      } else if (AUTH_REQUIRED) {
        set({ currentUserId: null, currentUsername: null, status: "signedOut" });
      } else {
        // No real account remembered and auth is optional — fall back to the always-available
        // anonymous local profile (see lib/authConfig.ts's LOCAL_USER_ID) rather than landing
        // signed out with nowhere to go.
        useProgressStore.getState().hydrate(LOCAL_USER_ID);
        set({ currentUserId: LOCAL_USER_ID, currentUsername: null, status: "signedIn" });
      }
    },

    signUp: async (username, password) => {
      // Signing up while using the anonymous local profile carries that profile's own
      // progress into the new account, so creating an account never looks like it wiped
      // what was already there — the server seeds the new account with it directly.
      const seedProgress = get().currentUserId === LOCAL_USER_ID ? loadProgress(LOCAL_USER_ID) : undefined;
      try {
        const account = await signUpRequest(username, password, seedProgress);
        await signInAs(account);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof AccountApiError ? error.message : "Couldn't create that account." };
      }
    },

    signIn: async (username, password) => {
      try {
        const account = await signInRequest(username, password);
        await signInAs(account);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof AccountApiError ? error.message : "Couldn't sign in." };
      }
    },

    signOut: () => {
      saveCurrentAccount(null);
      if (AUTH_REQUIRED) {
        set({ currentUserId: null, currentUsername: null, status: "signedOut" });
      } else {
        // With auth optional, there's no "signed out" state to land in — the app always
        // has the anonymous local profile available (see AuthGate.tsx's own bootstrap),
        // so signing out of a real account falls back to it rather than leaving
        // currentUserId null, which would silently stop progress from saving at all.
        useProgressStore.getState().hydrate(LOCAL_USER_ID);
        set({ currentUserId: LOCAL_USER_ID, currentUsername: null, status: "signedIn" });
      }
    },
  };
});
