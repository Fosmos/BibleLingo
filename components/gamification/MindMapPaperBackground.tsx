// A large dot-grid "paper" tiled behind the whole Mind Map scene (see MindMapCanvas.tsx),
// panning with the canvas's own <g> transform rather than staying fixed to the viewport — a
// nod to the graph-paper backdrop most mind-mapping tools draw their canvas on, and a cheap
// way to make panning/zooming itself read as movement across an actual surface instead of a
// flat color sliding around. Also owns the shared drop-shadow filter every pill (book,
// chapter, pericope) references, since defining it once here is simplest.
export function MindMapPaperBackground() {
  return (
    <>
      <defs>
        <pattern id="mm-dots" width={28} height={28} patternUnits="userSpaceOnUse">
          <circle cx={2} cy={2} r={1.4} className="fill-line/50 dark:fill-zinc-700/60" />
        </pattern>
        <filter id="mm-pill-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect x={-2000} y={-2000} width={4000} height={4000} fill="url(#mm-dots)" />
    </>
  );
}
