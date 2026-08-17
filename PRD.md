# Product Requirements Document
## Project: Verses (Bible Verse Memorization App)

**Version:** 1.0.0
**Status:** Pre-Development / Architecture Lock
**Owner:** Product Architecture
**Build Target:** Claude Code CLI, phased execution against `features.json`

---

## 1. Vision

A Duolingo-style progressive web app that turns Scripture memorization into a daily micro-habit. Users memorize verses through short, gamified drills, retain them through spaced repetition, and are pulled back daily through loss-aversion mechanics (streaks, hearts, cracked nodes).

The product is not a Bible reader. It is a **memorization trainer**. Every screen either teaches a verse, drills a verse, or protects a streak.

---

## 2. Problem Statement

People who want to memorize Scripture stop for three reasons:
1. **No structure** — they don't know how to break a verse into learnable chunks.
2. **No retention system** — they memorize once, then forget within weeks (nothing resurfaces the verse before it decays).
3. **No daily pull** — there is no mechanism creating urgency to return.

This app solves all three with: segmented micro-lessons, an SM-2 spaced repetition engine, and streak/heart loss-aversion loops.

---

## 3. Target Users

- Primary: Individuals in personal devotion or small-group Bible study who want a structured, habitual memorization tool.
- Secondary: Youth ministries / Sunday school programs assigning weekly memory verses.
- Tertiary: Competitive memorizers (AWANA-style clubs) needing drilled recall under pressure.

---

## 4. Core Habit Loops

### 4.1 Micro-Lessons
- Each lesson is 1–3 minutes.
- A verse is segmented into "chunks" (clause-level or phrase-level) so early nodes teach fragments and later nodes assemble the full verse.
- A lesson = a fixed sequence of drills pulled from the 5 Drill Types (Section 5), scored and completed in one sitting.

### 4.2 Streak Counter (Loss Aversion)
- Increments once per calendar day a lesson or review is completed.
- Breaks trigger a **Streak Loss Notification** (in-app modal on next open; push notification is out of scope for MVP, see Section 9).
- **Streak Freeze**: a consumable item that auto-protects one missed day. Users hold a small inventory (earned via milestones, not purchased in MVP).
- Streak state must be resilient to the user closing the tab mid-lesson (persisted immediately on lesson completion, not on session end).

### 4.3 5-Heart Energy System
- User starts each lesson with 5 hearts (heart pool is global, not per-lesson).
- Each incorrect drill answer costs 1 heart, evaluated at the drill level (not per-keystroke).
- 0 hearts = lesson locked until refill.
- Refill mechanics: passive regeneration on a fixed timer (e.g., 1 heart per N minutes — exact interval is a config constant, not hardcoded in components), OR immediate refill via a "Practice" review session (completing a review of already-cracked nodes restores hearts without needing the timer).
- Hearts UI must visually communicate depletion in real time (not just on next load).

### 4.4 Gamified Progression Path / Skill Tree
- A vertical/branching node map, one node per verse or verse-segment.
- Node visual states (minimum required):
  - `locked` — prerequisite not met
  - `available` — unlocked, not started
  - `in_progress` — started, not mastered
  - `mastered` — completed Final Recitation Challenge
  - `cracked` — mastered previously, but SRS review interval has expired (decay warning)
- Tapping a node opens the lesson/review flow appropriate to its state.

---

## 5. The 5 Drill Types

Every drill type is a **self-contained, swappable component** taking a verse-segment payload and returning a pass/fail + partial-credit result to the Lesson Session Controller. None of the drills manage hearts, streaks, or navigation directly — they report results upward.

| # | Drill | Mechanic | Failure Condition |
|---|-------|----------|---------------------|
| 1 | **Cloze Test** | Verse rendered with blanks; user selects the correct word from a small multiple-choice bank per blank. | Wrong word selected for any blank. |
| 2 | **Sentence Builder** | Word tiles shown out of order; user taps/drags them into correct sequence. | Final sequence does not match verse order. |
| 3 | **First-Letter Prompt** | Verse shown with only first letters visible (e.g., "I t b w t W..."); user types or selects the full verse. | Recalled text does not match (fuzzy match on whitespace/punctuation allowed). |
| 4 | **Audio Recitation** | Verse audio plays; certain spoken words are masked; user fills the masked words. | Missing/incorrect word for a masked audio segment. |
| 5 | **Final Recitation Challenge** | No scaffolding — user recalls and enters the full verse from memory. Gate for node mastery. | Recall does not match verse within defined tolerance. |

Design constraint: drills 1–4 are **teaching** drills (used while learning a node); drill 5 is the **mastery gate** (must be passed to flip a node to `mastered`) and is also the drill type reused for SRS review sessions on `cracked` nodes.

---

## 6. Spaced Repetition System (SRS)

- Algorithm: **SM-2** (SuperMemo-2), implemented as a pure, framework-agnostic function set in `lib/srs.ts`.
- Each mastered node carries SRS metadata: `repetition count`, `easiness factor`, `interval`, `last reviewed date`, `next due date`.
- When `next due date` has passed, the node's visual state flips to `cracked` on the Skill Tree — this is the primary re-engagement trigger, independent of streak mechanics.
- Reviewing a `cracked` node re-runs it through the Final Recitation Challenge; a pass recalculates the next interval via SM-2 and clears the `cracked` state.
- SRS state must survive reloads (see Section 7) — it is not derived data, it is the source of truth for node state on every app load.

---

## 7. Persistence

- MVP persistence layer: browser `localStorage`, versioned (schema version key) so future migrations don't corrupt existing user progress.
- Persisted domains: streak state, heart state + last-regen timestamp, per-node progress + SRS metadata, streak freeze inventory.
- No backend/auth in MVP scope — this is a local-first single-user experience.

---

## 8. Success Metrics (Product-Level, Not Engineering)

- D1/D7 retention driven by streak mechanic engagement.
- % of mastered nodes that get "cracked" and successfully re-reviewed (validates SRS is doing its job, not just decorative).
- Average hearts lost per lesson (signal for drill difficulty tuning).
- Lesson completion rate vs. abandonment rate.

---

## 9. Explicitly Out of Scope (MVP)

- User accounts, auth, or cloud sync.
- Push notifications (streak-loss notification is in-app/modal only for MVP).
- Monetization / IAP for streak freezes.
- Multi-translation verse support (single translation source for MVP).
- Social/leaderboard features.

---

## 10. Milestone Mapping

Delivery is tracked phase-by-phase in `features.json`, mapped as:

1. **Phase 1** — Skeleton & Zustand Baseline
2. **Phase 2** — Gamification Shell & Skill Tree UI
3. **Phase 3** — Interactive Drill Engines
4. **Phase 4** — SRS Engine & Local Storage Persistence
5. **Phase 5** — Audio-Visual Polish & Celebration Screens

No phase begins until the prior phase's features are marked `completed` in `features.json`. This PRD and `CLAUDE.md` are the two source-of-truth documents Claude Code should re-read before starting any new phase.
