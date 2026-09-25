"use client";

import { useState } from "react";
import { Header } from "@/components/gamification/Header";
import { MindMapPathPicker } from "@/components/gamification/MindMapPathPicker";
import { TopicPicker } from "@/components/gamification/TopicPicker";

// "Choose your path": a book, chapter or verse is picked by navigating the Mind Map itself (see
// MindMapPathPicker.tsx); a topic — verses from all over Scripture, with no one place on the
// map — from its own list.
export function BeginFlow() {
  const [choosingTopic, setChoosingTopic] = useState(false);

  if (!choosingTopic) return <MindMapPathPicker onChooseTopic={() => setChoosingTopic(true)} />;

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center p-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-line p-6 text-left dark:border-zinc-800">
          <h2 className="mb-1 text-title">Choose a topic</h2>
          <p className="mb-6 text-sm text-ink-muted">Verses gathered from across Scripture around one theme.</p>
          <TopicPicker onBack={() => setChoosingTopic(false)} />
        </div>
      </div>
    </div>
  );
}
