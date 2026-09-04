// SERVER ONLY — reads/writes local disk. Never import this from a "use client" component;
// only the app/api/account/* Route Handlers should call it.
//
// Accounts and progress used to live purely in the browser's localStorage, which is scoped
// per-origin (scheme+host+port). On this LAN dev setup the origin is a raw IP that changes
// whenever DHCP renews the lease, so every IP change looked like signing in on a brand new,
// empty device — the account and progress weren't actually lost, just invisible from the new
// origin. Storing both here instead — on the one thing that stays constant across an IP
// change, this dev server's own machine — fixes that: any origin that reaches this same
// server process sees the same accounts and progress.
import { promises as fs } from "fs";
import path from "path";
import type { AccountRecord, UserProgress } from "@/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const PROGRESS_DIR = path.join(DATA_DIR, "progress");

async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(PROGRESS_DIR, { recursive: true });
}

export async function readAccounts(): Promise<AccountRecord[]> {
  try {
    const raw = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    return JSON.parse(raw) as AccountRecord[];
  } catch {
    return [];
  }
}

export async function writeAccounts(accounts: AccountRecord[]): Promise<void> {
  await ensureDataDirs();
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

// `userId` is always a crypto.randomUUID() (see useAuthStore.ts's signUp) — safe to use
// directly as a filename with no further sanitizing.
function progressFile(userId: string): string {
  return path.join(PROGRESS_DIR, `${userId}.json`);
}

export async function readServerProgress(userId: string): Promise<UserProgress | null> {
  try {
    const raw = await fs.readFile(progressFile(userId), "utf-8");
    return JSON.parse(raw) as UserProgress;
  } catch {
    return null;
  }
}

export async function writeServerProgress(userId: string, progress: UserProgress): Promise<void> {
  await ensureDataDirs();
  await fs.writeFile(progressFile(userId), JSON.stringify(progress));
}
