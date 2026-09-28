"use client";

import type { Narration } from "@/lib/speechifyTts";

// The Listen stage's natural narration (app/api/tts/route.ts, via Speechify), fetched once per
// verse and kept on the device — in memory, and in the browser's Cache Storage where it's
// available — so replaying a verse, or coming back to it another day, costs none of the free
// character quota. Returns null whenever narration isn't available (no key on the server, the
// quota used up, offline), and the caller falls back to the browser's own voice.

const CACHE_NAME = "verses-narration-v1";
const memory = new Map<string, Narration>();
const inFlight = new Map<string, Promise<Narration | null>>();
// Once the server says narration isn't set up, or the quota is spent, stop asking this session.
let unavailable = false;

// FNV-1a — a short, stable cache key for a verse's text.
function textKey(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `/__narration/${(hash >>> 0).toString(36)}-${text.length}`;
}

async function openCache(): Promise<Cache | null> {
  try {
    return typeof caches === "undefined" ? null : await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

const RATE_LIMIT_RETRY_MS = 1200;
// Requests go out one at a time — Speechify turns away several at once (Listen & Repeat fetches
// every line of a verse up front).
let queue: Promise<unknown> = Promise.resolve();
function requestNarration(text: string): Promise<Response> {
  const request = queue.then(() => fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }));
  queue = request.catch(() => undefined);
  return request;
}

async function load(text: string, key: string): Promise<Narration | null> {
  const cache = await openCache();
  const cached = await cache?.match(key);
  if (cached) return (await cached.json()) as Narration;

  let response = await requestNarration(text);
  let body = response.ok ? null : ((await response.json().catch(() => ({}))) as { upstreamStatus?: number });
  // Too many at once (the free tier is strict about that): wait a moment and try once more.
  if (body?.upstreamStatus === 429) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_MS));
    response = await requestNarration(text);
    body = response.ok ? null : ((await response.json().catch(() => ({}))) as { upstreamStatus?: number });
  }
  if (!response.ok) {
    // 501: no key configured. 401/402/403 upstream: a bad key, or the free quota is used up.
    if (response.status === 501 || [401, 402, 403].includes(body?.upstreamStatus ?? 0)) unavailable = true;
    return null;
  }
  const narration = (await response.json()) as Narration;
  await cache?.put(key, new Response(JSON.stringify(narration), { headers: { "Content-Type": "application/json" } }));
  return narration;
}

export function fetchNarration(text: string): Promise<Narration | null> {
  if (unavailable) return Promise.resolve(null);
  const key = textKey(text);
  const known = memory.get(key);
  if (known) return Promise.resolve(known);
  const pending = inFlight.get(key);
  if (pending) return pending;
  const request = load(text, key)
    .catch(() => null)
    .then((narration) => {
      inFlight.delete(key);
      if (narration) memory.set(key, narration);
      return narration;
    });
  inFlight.set(key, request);
  return request;
}

// Plays a narration, reporting where in the text each word starts as it's heard (the same
// `charIndex` contract as lib/speechSynthesis.ts's speakWithWordBoundaries). Returns a cancel.
// `onBlocked` fires if the browser refuses to start playback at all.
// Pass `player` to reuse one audio element: a phone only lets audio start from a tap, but an
// element started once by a tap may then play again on its own (Listen & Repeat's later lines).
export function playNarration(
  narration: Narration,
  onWordBoundary: (charIndex: number) => void,
  onEnd: () => void,
  onBlocked: () => void,
  player?: HTMLAudioElement,
): () => void {
  const audio = player ?? new Audio();
  audio.src = `data:audio/mpeg;base64,${narration.audio}`;
  let frame = 0;
  let lastStart = -1;
  const tick = () => {
    const ms = audio.currentTime * 1000;
    let current: number | undefined;
    for (const mark of narration.marks) {
      if (mark.startMs <= ms) current = mark.start;
      else break;
    }
    if (current !== undefined && current !== lastStart) {
      lastStart = current;
      onWordBoundary(current);
    }
    frame = requestAnimationFrame(tick);
  };
  audio.onended = () => {
    cancelAnimationFrame(frame);
    onEnd();
  };
  audio.play().then(
    () => {
      frame = requestAnimationFrame(tick);
    },
    () => onBlocked(),
  );
  return () => {
    cancelAnimationFrame(frame);
    audio.pause();
  };
}
