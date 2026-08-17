# CLAUDE.md — Root Context Anchor

This file is read before any implementation work begins. It is binding for the duration of the build. If a request conflicts with this file, this file wins — flag the conflict instead of silently resolving it.

Reference `PRD.md` for product behavior and `features.json` for what to build next and how to mark it done. This file governs **how** things are built, not **what**.

---

## 1. Tech Stack (Locked)

| Layer | Choice |
|---|---|
| Framework | Next.js — **App Router**, TypeScript only (no `.js`/`.jsx`) |
| Styling | Tailwind CSS (utility classes only) |
| Animation | Framer Motion |
| State | Zustand |
| Icons | Lucide React |
| Audio | Web Audio API / Howler.js |

Do not introduce alternate libraries for anything the above already covers (e.g., no Redux, no styled-components, no react-spring). If a new dependency seems necessary, stop and surface the tradeoff instead of installing it.

---

## 2. Directory Structure (Enforced)

```
app/
  layout.tsx
  page.tsx
  learn/
  lesson/[nodeId]/
  profile/
components/
  drills/              # one file per drill type, see Section 4
  gamification/         # SkillTree, StreakCounter, HeartMeter, CrackedNodeBadge, etc.
  ui/                   # generic, verse-agnostic primitives (Button, Modal, ProgressBar)
lib/
  srs.ts                # SM-2 implementation — pure functions, no React, no side effects
  storage.ts            # localStorage read/write + schema versioning
  audio.ts              # Howler wrapper / playback controller
store/
  useProgressStore.ts   # node states, streak, hearts (Zustand slices)
types/
  index.ts              # all shared interfaces/types — single source of truth
public/
  audio/                # verse narration assets
```

**Rules:**
- New components go in the matching folder above. Do not create ad-hoc top-level folders.
- `lib/srs.ts` must remain framework-agnostic — importable and testable with zero React/Next dependency.
- `types/index.ts` is the only place shared types are declared. Component-local types (props-only, unused elsewhere) may live next to the component.

---

## 3. Code Quality Constraints (Non-Negotiable)

- **No file exceeds 200 lines.** If a component approaches the limit, extract sub-components or hooks rather than compressing code.
- **Strict TypeScript.** No `any`, no implicit `any`, no `@ts-ignore` used to silence a real type error. Every component has an explicit `Props` interface.
- **No inline styles.** No `style={{...}}`. All visual styling is Tailwind utility classes. If a value must be dynamic (e.g., a computed width), use a Tailwind-safe pattern (CSS variables via className, or conditional class composition) — not a `style` attribute.
- **Pure, modular components.** A component receives data and callbacks via props and renders; it does not reach into global state it wasn't given unless it *is* a store-connected container by design. Prefer presentational components + a small number of container components that talk to Zustand.
- **No default exports** for components — use named exports for consistent refactor-safety and import clarity.
- **One component, one responsibility.** A drill component renders and scores its own drill type only — it does not manage hearts, streaks, or routing. Those are the Lesson Session Controller's job.

---

## 4. Component Contracts

### Drills (`components/drills/`)
Every drill component (`ClozeTest.tsx`, `SentenceBuilder.tsx`, `FirstLetterPrompt.tsx`, `AudioRecitation.tsx`, `FinalRecitation.tsx`) must:
- Accept a verse-segment payload as props (typed via `types/index.ts`, e.g. `DrillPayload`).
- Return results upward via a callback prop (e.g. `onComplete(result: DrillResult)`), never mutate global state directly.
- Contain no knowledge of hearts, streaks, or SRS — those live in the store / `lib/srs.ts`.

### Gamification (`components/gamification/`)
`SkillTree`, `StreakCounter`, `HeartMeter`, node-status badges. These may read from the Zustand store but should not contain drill logic or SRS math — they render state and dispatch intents (e.g., "start lesson for node X").

---

## 5. State Management Rules

- Zustand store lives in `store/`, organized as slices (progress, hearts, streak) composed into one store, or split stores if a slice grows past a clear boundary — but never duplicate the same piece of state in two places.
- Store actions are the only way component state changes flow into persistence. `lib/storage.ts` is called from store actions, not from components directly.
- Derived UI state (e.g., "is this node cracked right now") is computed from SRS due-dates at read time — it is not stored as a separate boolean that can drift out of sync.

---

## 6. Terminal Commands

```bash
npm run dev      # local development server
npm run build    # production build — must pass with zero type errors before a phase is marked complete
npm run lint     # must pass with zero errors before a phase is marked complete
```

A phase in `features.json` is not marked `completed` until `npm run build` and `npm run lint` both pass clean.

---

## 7. Working Agreement for Claude Code

- Before starting a phase, re-read `PRD.md` (for behavior) and the relevant phase block in `features.json` (for scope and acceptance criteria).
- Do not start Phase N+1 features while Phase N features are still `pending` or `in_progress`, unless explicitly instructed otherwise.
- After completing a feature, update its `status` in `features.json` and note any deviation from its `acceptance_criteria` rather than silently reinterpreting scope.
- When a requirement in this file and a convenience shortcut conflict (e.g., "just inline this style to save time"), this file wins.
