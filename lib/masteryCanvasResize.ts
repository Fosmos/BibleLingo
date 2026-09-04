// Wires a ResizeObserver to keep a canvas's backing store matched to its container at the
// current devicePixelRatio — pulled out of MasteryTrack.tsx so that component's lifecycle
// effect stays a one-liner. Returns the disconnect function for effect cleanup.
export interface CanvasSize {
  width: number;
  height: number;
  dpr: number;
}

export function observeCanvasSize(
  container: HTMLDivElement,
  canvas: HTMLCanvasElement,
  onResize: (size: CanvasSize) => void,
): () => void {
  const observer = new ResizeObserver(() => {
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize({ width, height, dpr });
  });
  observer.observe(container);
  return () => observer.disconnect();
}
