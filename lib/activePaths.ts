// Every active path, focused one included, in the order they were started. A profile saved
// before several paths could run at once has no `activePathKeys` yet — its one `activePathKey`
// stands in, so nothing needs migrating. Pure (no store import) so store/pathActions.ts can use it.
export function activePathKeysOf(state: { activePathKey: string | null; activePathKeys?: string[] }): string[] {
  const keys = [...(state.activePathKeys ?? [])];
  if (state.activePathKey && !keys.includes(state.activePathKey)) keys.push(state.activePathKey);
  return keys;
}
