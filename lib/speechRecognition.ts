interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultEvent extends Event {
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const globalWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export interface SpeechListener {
  transcriptPromise: Promise<string>;
  stop: () => void;
}

// continuous:true keeps the mic open across natural pauses between words/sentences —
// without it, Chrome auto-stops after a very short silence, cutting reciters off mid-verse.
// The caller drives stop() explicitly (e.g. a "Done" button) rather than relying on silence.
export function startListening(onInterim?: (transcript: string) => void): SpeechListener {
  const RecognitionCtor = getSpeechRecognitionCtor();
  if (!RecognitionCtor) {
    return {
      transcriptPromise: Promise.reject(new Error("Speech recognition is not supported in this browser.")),
      stop: () => {},
    };
  }

  const recognition = new RecognitionCtor();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let latestFinal = "";
  let latestInterim = "";

  const transcriptPromise = new Promise<string>((resolve) => {
    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      latestFinal = final;
      latestInterim = interim;
      onInterim?.((final + interim).trim());
    };
    recognition.onerror = () => resolve((latestFinal || latestInterim).trim());
    recognition.onend = () => resolve((latestFinal || latestInterim).trim());
  });

  recognition.start();

  return { transcriptPromise, stop: () => recognition.stop() };
}
