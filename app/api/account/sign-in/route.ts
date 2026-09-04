import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { readAccounts } from "@/lib/serverStore";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// Verifies a username/password against the server-side account list (see lib/serverStore.ts)
// and hands back only the account's public fields — the password hash/salt never leave the
// server, unlike the old localStorage-only design where the whole account record (hash
// included) had to live in the browser for client-side verification.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const normalized = normalizeUsername(username);
  const accounts = await readAccounts();
  const account = accounts.find((candidate) => candidate.username === normalized);

  if (!account || !(await verifyPassword(password, account.salt, account.passwordHash))) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  return NextResponse.json({ id: account.id, username: account.username, createdAt: account.createdAt });
}
