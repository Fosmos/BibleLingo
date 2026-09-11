// SERVER ONLY — stores accounts and progress.
// Uses Supabase REST API when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// are set in the environment (ideal for production / Vercel serverless deployments).
// Falls back to local disk (.data/) if Supabase is unconfigured (offline dev).
import { promises as fs } from "fs";
import path from "path";
import type { AccountRecord, UserProgress } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

function getSupabaseHeaders() {
  return {
    apikey: SUPABASE_KEY!,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

const DATA_DIR = path.join(process.cwd(), ".data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const PROGRESS_DIR = path.join(DATA_DIR, "progress");

async function ensureDataDirs(): Promise<void> {
  await fs.mkdir(PROGRESS_DIR, { recursive: true });
}

// Fallback disk operations
async function readDiskAccounts(): Promise<AccountRecord[]> {
  try {
    const raw = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    return JSON.parse(raw) as AccountRecord[];
  } catch {
    return [];
  }
}

async function writeDiskAccounts(accounts: AccountRecord[]): Promise<void> {
  await ensureDataDirs();
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

function progressFile(userId: string): string {
  return path.join(PROGRESS_DIR, `${userId}.json`);
}

async function readDiskProgress(userId: string): Promise<UserProgress | null> {
  try {
    const raw = await fs.readFile(progressFile(userId), "utf-8");
    return JSON.parse(raw) as UserProgress;
  } catch {
    return null;
  }
}

async function writeDiskProgress(userId: string, progress: UserProgress): Promise<void> {
  await ensureDataDirs();
  await fs.writeFile(progressFile(userId), JSON.stringify(progress));
}

export async function readAccounts(): Promise<AccountRecord[]> {
  if (isSupabaseConfigured) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/accounts?select=*`, {
        headers: getSupabaseHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        return rows.map((r: { id: string; username: string; password_hash: string; salt: string; created_at: string }) => ({
          id: r.id,
          username: r.username,
          passwordHash: r.password_hash,
          salt: r.salt,
          createdAt: r.created_at,
        }));
      }
    } catch {
      // If network error, fall through to disk
    }
  }
  return readDiskAccounts();
}

export async function writeAccounts(accounts: AccountRecord[]): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      const latest = accounts[accounts.length - 1];
      if (latest) {
        await fetch(`${SUPABASE_URL}/rest/v1/accounts`, {
          method: "POST",
          headers: {
            ...getSupabaseHeaders(),
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            id: latest.id,
            username: latest.username,
            password_hash: latest.passwordHash,
            salt: latest.salt,
            created_at: latest.createdAt,
          }),
        });
      }
    } catch {
      // Ignore or fall through
    }
  }
  await writeDiskAccounts(accounts);
}

export async function readServerProgress(userId: string): Promise<UserProgress | null> {
  if (isSupabaseConfigured) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/user_progress?user_id=eq.${encodeURIComponent(userId)}&select=progress`, {
        headers: getSupabaseHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0 && rows[0].progress) {
          return rows[0].progress as UserProgress;
        }
      }
    } catch {
      // Fall through to disk
    }
  }
  return readDiskProgress(userId);
}

export async function writeServerProgress(userId: string, progress: UserProgress): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/user_progress`, {
        method: "POST",
        headers: {
          ...getSupabaseHeaders(),
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          user_id: userId,
          progress: progress,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch {
      // Fall through to disk
    }
  }
  await writeDiskProgress(userId, progress);
}
