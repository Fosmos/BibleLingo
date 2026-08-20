interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: { length: number; [index: number]: SpeechRecognitionResultLike } }) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const gw = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return gw.SpeechRecognition ?? gw.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function isSecureContextOrLocal(): boolean {
  if (typeof window === "undefined") return true;
  if (window.isSecureContext) return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export type MicPermissionState = "prompt" | "granted" | "denied" | "unsupported";

export async function checkMicPermissionStatus(): Promise<MicPermissionState> {
  if (typeof window === "undefined" || !isSpeechRecognitionSupported()) return "unsupported";
  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    try {
      const res = await navigator.permissions.query({ name: "microphone" as PermissionName });
      if (res.state === "granted" || res.state === "denied") return res.state;
    } catch {}
  }
  return "prompt";
}

export async function requestMicPermission(): Promise<MicPermissionState> {
  if (typeof window === "undefined" || !isSpeechRecognitionSupported()) return "unsupported";
  if (!navigator.mediaDevices?.getUserMedia) return "prompt";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch {
    return "denied";
  }
}

export interface SpeechListener { transcriptPromise: Promise<string>; stop: () => void }
export type SpeechErrorKind = "denied" | "audio-capture" | "network" | "unknown";

/** Strip leading words in `next` that duplicate the tail of `prev` (session-restart overlap). */
function dedupeJoin(prev: string, next: string): string {
  if (!prev) return next;
  if (!next) return prev;
  const pw = prev.split(/\s+/), nw = next.split(/\s+/);
  for (let n = Math.min(pw.length, nw.length, 4); n >= 1; n--) {
    if (pw.slice(-n).every((w, i) => w.toLowerCase() === nw[i].toLowerCase())) {
      return [prev, ...nw.slice(n)].join(" ");
    }
  }
  return prev + " " + next;
}

export function startListening(
  onInterim?: (transcript: string) => void,
  onError?: (errorKind: SpeechErrorKind) => void,
): SpeechListener {
  const RecognitionCtor = getSpeechRecognitionCtor();
  if (!RecognitionCtor) {
    onError?.("unknown");
    return {
      transcriptPromise: Promise.reject(new Error("Speech recognition not supported.")),
      stop: () => {},
    };
  }
  const Ctor = RecognitionCtor;
  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)

  let active = true;
  let stopped = false;
  let accumulated = "";
  let sessionText = "";
  let sessionFinals = "";
  let recognition: SpeechRecognitionLike | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let timer2: ReturnType<typeof setTimeout> | null = null;

  let resolvePromise: (t: string) => void;
  const transcriptPromise = new Promise<string>((r) => { resolvePromise = r; });

  function finish() {
    if (!active) return;
    active = false;
    if (timer) clearTimeout(timer);
    if (timer2) clearTimeout(timer2);
    try { recognition?.stop(); } catch {}
    resolvePromise(dedupeJoin(accumulated, sessionFinals).trim());
  }

  function init() {
    if (!active || stopped) return;
    try {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.continuous = !(isIOS || isAndroid);
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        let finals = "", interim = "";

        // Rebuild from 0 every time to avoid resultIndex bugs on mobile
        for (let i = 0; i < event.results.length; ++i) {
          const txt = event.results[i][0]?.transcript ?? "";
          if (event.results[i].isFinal) {
            finals = finals ? finals + " " + txt : txt;
          } else {
            interim = txt; // Overwrite the active interim phase
          }
        }

        sessionFinals = finals;
        sessionText = finals ? finals + " " + interim : interim;
        onInterim?.(dedupeJoin(accumulated, sessionText).trim());
      };

      rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
        const err = event.error;
        if (err === "no-speech" || err === "aborted") return;
        if (err === "not-allowed" || err === "service-not-allowed") {
          onError?.("denied"); finish();
        } else if (err === "audio-capture") {
          onError?.("audio-capture"); finish();
        } else if (err === "network") {
          onError?.("network");
        }
      };

      rec.onend = () => {
        if (sessionFinals) accumulated = dedupeJoin(accumulated, sessionFinals).trim();
        sessionText = "";
        sessionFinals = "";
        if (active && !stopped) {
          timer = setTimeout(() => { if (active && !stopped) init(); }, 100);
          timer2 = setTimeout(() => { if (active && !stopped) { stopped = true; finish(); } }, 5000);
        } else {
          finish();
        }
      };

      recognition = rec;
      rec.start();
    } catch {
      if (active && !stopped) {
        timer = setTimeout(() => { if (active && !stopped) init(); }, 200);
      }
    }
  }

  init();
  return {
    transcriptPromise,
    stop: () => { stopped = true; finish(); },
  };
}
