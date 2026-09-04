// Client-side handwriting recognition for the Draw First Letter stage — lazy-loads
// Tesseract.js (a free, offline OCR engine; no API key, no per-use cost) via dynamic import so
// its WASM/language-data payload (several MB) only downloads once a user actually reaches
// this stage, not on initial app load. One worker is created and reused for the rest of the
// session rather than per-recognition, since worker startup itself takes real time.
let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = import("tesseract.js").then(async ({ default: Tesseract }) => {
      const worker = await Tesseract.createWorker("eng");
      // Recognizing exactly one hand-drawn character at a time — SINGLE_CHAR page
      // segmentation mode is tuned for that, instead of Tesseract's default full-page/line
      // assumption, which otherwise tends to return nothing for one isolated glyph.
      await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR });
      return worker;
    });
  }
  return workerPromise;
}

const NOT_A_LETTER = /[^\p{L}\p{N}]/gu;

// Recognizes a single handwritten character from a canvas. Returns the recognized character
// (uppercase) or null if nothing legible was detected. Used only to decide whether to
// auto-advance the Draw First Letter stage (see lib/useAutoRecognizeDraw.ts) — never to grade
// correctness, since OCR on one quick freehand stroke is too unreliable to treat as pass/fail;
// the stage still reveals the real printed letter, not whatever this returns.
export async function recognizeCharacter(canvas: HTMLCanvasElement): Promise<string | null> {
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas);
  const cleaned = data.text.replace(NOT_A_LETTER, "");
  return cleaned.length > 0 ? cleaned[0].toUpperCase() : null;
}
