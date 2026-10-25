import { create } from "zustand";

export type PalaceView = "storyboard" | "room";

interface PalaceViewState {
  // How an opened passage in the Palace shows its verses (BookStructurePassage.tsx) — kept while
  // the app's open, so opening the next passage keeps the reader's pick.
  view: PalaceView;
  setView: (view: PalaceView) => void;
}

export const usePalaceViewStore = create<PalaceViewState>((set) => ({
  view: "storyboard",
  setView: (view) => set({ view }),
}));
