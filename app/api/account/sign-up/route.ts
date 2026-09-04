import { NextRequest, NextResponse } from "next/server";
import type { AccountRecord, UserProgress } from "@/types";
import { generateSalt, hashPassword } from "@/lib/auth";
import { getDefaultProgress } from "@/lib/storage";
import { readAccounts, writeAccounts, writeServerProgress } from "@/lib/serverStore";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// Creates an account server-side (see lib/serverStore.ts for why accounts live here now,
// not just in the browser). `seedProgress` lets the client carry its current local-profile
// progress into the new account, matching the old localStorage-only signUp's behavior of
// never looking like it wiped what was already there.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const seedProgress = body?.seedProgress as UserProgress | undefined;

  const normalized = normalizeUsername(username);
  if (!normalized) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
  }

  const accounts = await readAccounts();
  if (accounts.some((account) => account.username === normalized)) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const account: AccountRecord = {
    id: crypto.randomUUID(),
    username: normalized,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  await writeAccounts([...accounts, account]);
  await writeServerProgress(account.id, seedProgress ?? getDefaultProgress());

  return NextResponse.json({ id: account.id, username: account.username, createdAt: account.createdAt });
}
