"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
const todayLabel = () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

// Today's date as "Friday, October 2", in the reader's own time zone — undefined during server
// render (which may sit in another time zone), filled in once on the device.
export function useTodayLabel(): string | undefined {
  return useSyncExternalStore(noSubscribe, todayLabel, () => undefined);
}
