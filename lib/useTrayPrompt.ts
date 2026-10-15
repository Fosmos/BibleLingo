"use client";

import { useEffect } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";

// A step with its own question (the verse reference after a recall stage) shows it as the lesson
// page tray's prompt (DrillHelpChips.tsx) while it's on screen — true when it did, so the step
// can leave out its own copy of the question.
export function useTrayPrompt(prompt: string): boolean {
  const lessonPage = useLessonSessionStore((state) => state.lessonPageOpen);
  const setTrayPrompt = useLessonSessionStore((state) => state.setTrayPrompt);
  useEffect(() => {
    if (!lessonPage) return;
    setTrayPrompt(prompt);
    return () => setTrayPrompt(null);
  }, [lessonPage, prompt, setTrayPrompt]);
  return lessonPage;
}
