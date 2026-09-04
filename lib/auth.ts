// Local-only password hashing (Web Crypto, no backend to defer this to). Not a substitute
// for real server-side auth security — it's a client-side account gate for a single-device
// app, sized to match — but still salted PBKDF2 rather than plaintext or a raw hash.

const PBKDF2_ITERATIONS = 100_000;

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  // crypto.subtle only exists in a secure context (https://, or http://localhost) — a plain
  // http:// LAN address (e.g. an iPad hitting the dev server's own LAN IP) has no subtle
  // crypto at all, so this would otherwise throw a cryptic TypeError deep inside importKey.
  // Surfacing it here with a clear, actionable message is what lets the calling form show it
  // instead of hanging forever waiting on a promise that already rejected.
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "Creating or signing into an account needs a secure connection (https://, or http://localhost) — a plain http:// LAN address can't do this. Run the dev server with `npm run dev:https` and use https:// on this device instead.",
    );
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return toHex(derived);
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const actualHash = await hashPassword(password, salt);
  return actualHash === expectedHash;
}
