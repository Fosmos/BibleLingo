const TAP_SLOP = 8;

export interface PointerHandlers {
  // A press on something draggable returns true, and the drag calls below follow instead of looking.
  grab: (event: PointerEvent) => boolean;
  drag: (event: PointerEvent) => void;
  drop: () => void;
  look: (dx: number, dy: number) => void;
  tap: (event: PointerEvent) => void;
}

// Turns one finger or mouse on the canvas into a tap, a look or a drag.
export class PointerInput {
  private pointer: { id: number; x: number; y: number; startX: number; startY: number; moved: boolean; grabbed: boolean } | null = null;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly handlers: PointerHandlers) {
    canvas.addEventListener("pointerdown", this.down);
    canvas.addEventListener("pointermove", this.move);
    canvas.addEventListener("pointerup", this.up);
    canvas.addEventListener("pointercancel", this.cancel);
  }

  private down = (event: PointerEvent) => {
    if (this.pointer) return;
    this.canvas.setPointerCapture(event.pointerId);
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, grabbed: this.handlers.grab(event) };
  };

  private move = (event: PointerEvent) => {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > TAP_SLOP) pointer.moved = true;
    if (!pointer.grabbed) this.handlers.look(event.clientX - pointer.x, event.clientY - pointer.y);
    else if (pointer.moved) this.handlers.drag(event);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };

  private up = (event: PointerEvent) => {
    const pointer = this.pointer;
    if (!pointer || pointer.id !== event.pointerId) return;
    this.pointer = null;
    if (pointer.grabbed && pointer.moved) this.handlers.drop();
    else if (!pointer.moved) this.handlers.tap(event);
  };

  private cancel = () => {
    this.pointer = null;
  };

  dispose() {
    this.canvas.removeEventListener("pointerdown", this.down);
    this.canvas.removeEventListener("pointermove", this.move);
    this.canvas.removeEventListener("pointerup", this.up);
    this.canvas.removeEventListener("pointercancel", this.cancel);
  }
}
