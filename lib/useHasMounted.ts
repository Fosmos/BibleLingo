import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

// True only once the client has taken over after hydration — false during SSR and the
// client's own hydration render, so both agree on the very first paint. Prefer this over a
// `useState(false)` + `useEffect(() => setState(true))` pair: useSyncExternalStore's
// getServerSnapshot/getSnapshot split is what actually guarantees the server and the
// client's first render return the same value, without a setState-in-effect render cascade.
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
