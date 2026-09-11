"use client";

import { useState } from "react";
import { Moon, Play, Square, X } from "lucide-react";
import type { VerseSegment } from "@/types";
import { useSleepTimer } from "@/lib/useSleepTimer";
import { useWakeLock } from "@/lib/useWakeLock";
import { SleepTimerVersePicker } from "@/components/gamification/SleepTimerVersePicker";

interface SleepTimerViewProps {
  verses: VerseSegment[];
  onDone: () => void;
}

const DURATION_OPTIONS_MIN = [5, 10, 15, 30, 45, 60];
const DEFAULT_DURATION_MIN = 15;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// A passive, eyes-closed listening session for falling asleep — narrates a reader-chosen
// subset of their own memorized verses aloud (Web Speech API, see lib/useSleepTimer.ts and
// SleepTimerVersePicker.tsx), looping the playlist for as long as the chosen duration lasts,
// at a slower sleep-friendly pace with the volume fading out logarithmically over the final 3
// minutes. Same warm-on-black frame as VespersView.tsx (see UserProgress.vespersHour) for the
// same reason — cutting blue light before bed — but deliberately shows only each verse's own
// REFERENCE, never its full text: this is meant to be listened to with eyes closed, not read
// off a lit screen right before sleep. Ending naturally (the duration running out) just
// reverts to the picker rather than closing outright — nothing forces the reader's attention
// back to the screen at the moment they're meant to be drifting off; they only see it again if
// they open their eyes and check.
//
// Whether this keeps playing with the phone's screen off: NOT reliably, and that's a real
// limitation of browser text-to-speech, not something this screen can fully work around — the
// Web Speech API has no background-audio guarantee the way a real streaming <audio> element
// occasionally gets, and most mobile browsers suspend it outright once the screen locks or the
// tab is backgrounded. useWakeLock.ts's screen wake lock (see below) covers the single most
// common failure mode — the OS auto-locking the screen after its own idle timeout while the
// reader isn't touching the phone at all — but a reader who manually presses the lock button,
// or switches to another app, will most likely cut playback there; the copy below says so
// plainly rather than promising something browsers don't actually let a web page deliver.
export function SleepTimerView({ verses, onDone }: SleepTimerViewProps) {
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MIN);
  // Lazy initial value — every memorized verse starts selected, computed once from whatever
  // `verses` this screen opened with, not re-derived (and silently reset) on every render.
  const [selectedIds, setSelectedIds] = useState(() => new Set(verses.map((verse) => verse.id)));
  const selectedVerses = verses.filter((verse) => selectedIds.has(verse.id));
  const timer = useSleepTimer(selectedVerses, durationMinutes);
  useWakeLock(timer.isPlaying);

  function toggleVerse(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    timer.stop();
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-vespers-bg text-vespers-ink">
      <div className="flex items-center justify-between p-4">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-vespers-soft">
          <Moon size={14} /> Sleep Timer
        </p>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close Sleep Timer"
          className="flex h-10 w-10 items-center justify-center rounded-full text-vespers-soft hover:bg-vespers-surface"
        >
          <X size={20} />
        </button>
      </div>

      {timer.isPlaying ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
          <p className="text-sm uppercase tracking-widest text-vespers-soft">Now reading</p>
          <p className="font-serif text-2xl text-vespers-ink">{timer.currentVerse?.reference ?? ""}</p>
          <p className="font-mono text-4xl text-vespers-accent">{formatCountdown(timer.remainingSeconds)}</p>
          <button
            type="button"
            onClick={timer.stop}
            className="flex items-center gap-2 rounded-full border border-vespers-soft/30 px-6 py-3 text-sm font-medium text-vespers-ink hover:bg-vespers-surface"
          >
            <Square size={16} /> Stop
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-6 pb-6 pt-2 text-center">
          <p className="text-sm text-vespers-soft">
            Drift off to {selectedVerses.length} verse{selectedVerses.length === 1 ? "" : "s"}, read aloud on a loop.
          </p>
          <SleepTimerVersePicker verses={verses} selectedIds={selectedIds} onToggle={toggleVerse} />
          <div className="flex flex-wrap justify-center gap-2">
            {DURATION_OPTIONS_MIN.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setDurationMinutes(minutes)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  minutes === durationMinutes
                    ? "bg-vespers-accent text-vespers-bg"
                    : "border border-vespers-soft/30 text-vespers-ink hover:bg-vespers-surface"
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={timer.start}
            disabled={selectedVerses.length === 0}
            className="flex items-center gap-2 rounded-full bg-vespers-accent px-8 py-3 text-sm font-semibold text-vespers-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play size={16} /> Start
          </button>
          <p className="max-w-xs text-xs text-vespers-soft/70">
            Keeps your screen from auto-locking while playing, but manually locking your phone or switching apps will likely stop it — a browser
            limitation, not a setting.
          </p>
        </div>
      )}
    </div>
  );
}
