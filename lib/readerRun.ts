export type RunTap = { kind: "move" } | { kind: "clear" } | { kind: "range"; from: number; to: number };

// What tapping verse `verse` does to the reader's selected run of verses (`selected`, in order, in
// that verse's chapter). The verse just before or after the run joins it; an end of the run leaves it;
// the only verse selected clears. Any other verse starts over, on that verse alone.
export function tapRun(selected: number[], verse: number): RunTap {
  if (!selected.length) return { kind: "move" };
  const from = selected[0];
  const to = selected[selected.length - 1];
  if (verse === from - 1) return { kind: "range", from: verse, to };
  if (verse === to + 1) return { kind: "range", from, to: verse };
  if (from === to) return verse === from ? { kind: "clear" } : { kind: "move" };
  if (verse === from) return { kind: "range", from: from + 1, to };
  if (verse === to) return { kind: "range", from, to: to - 1 };
  return { kind: "move" };
}
