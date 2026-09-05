"use client";

import { useEffect, useRef, useState, type RefObject, type PointerEvent } from "react";
import {
  cameraCenteredOn,
  zoomTowardPoint,
  OVERVIEW_CAMERA,
  FOCUS_SCALE,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  type Camera,
  type Point,
} from "@/lib/mindMapLayout";

// Owns the Mind Map's pan/zoom camera state and every pointer/wheel interaction that moves
// it — split out of MindMapCanvas.tsx so that component can stay focused on composing the
// book/chapter/pericope tree, not the interaction plumbing. A drag pans (converting the raw
// client-pixel delta into the canvas's own fixed logical units via the SVG's actual on-screen
// size, since its viewBox scales to fit whatever the container's real size is); a wheel zooms
// toward the cursor, clamped by lib/mindMapLayout.ts's own MIN_SCALE/MAX_SCALE; focusOn
// (called when a chapter is clicked) snaps the camera to center + zoom on a world-space
// point — the caller applies its own CSS transition to the resulting transform (see
// MindMapCanvas.tsx) so that jump animates instead of a hard cut, rather than anything
// animated from in here.
export function useMindMapCamera(svgRef: RefObject<SVGSVGElement | null>) {
  const [camera, setCamera] = useState<Camera>(OVERVIEW_CAMERA);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{
    clientX: number;
    clientY: number;
    cameraX: number;
    cameraY: number;
    pointerId: number;
    captured: boolean;
  } | null>(null);

  function fitScale(): number {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return 1;
    return Math.min(rect.width / VIEWPORT_WIDTH, rect.height / VIEWPORT_HEIGHT);
  }

  // Inverts the SVG's own "xMidYMid meet" fit (letterboxed centering + uniform scale) to turn
  // a raw client-pixel position (e.g. a wheel event's clientX/Y) into this canvas's fixed
  // logical coordinate space.
  function clientToViewBox(clientX: number, clientY: number): Point {
    const rect = svgRef.current?.getBoundingClientRect();
    const scale = fitScale();
    if (!rect || scale === 0) return { x: 0, y: 0 };
    const offsetX = (rect.width - VIEWPORT_WIDTH * scale) / 2;
    const offsetY = (rect.height - VIEWPORT_HEIGHT * scale) / 2;
    return { x: (clientX - rect.left - offsetX) / scale, y: (clientY - rect.top - offsetY) / scale };
  }

  // Capturing the pointer (and flagging a drag) the instant the finger/mouse goes down would
  // redirect the matching pointerup — and so the synthetic click the browser derives from
  // down+up — onto the SVG root instead of whichever chapter/pericope node was actually
  // pressed, silently swallowing every tap. Waiting for a few pixels of real movement first
  // means a plain tap-and-release never captures anything, so it reaches that node's own
  // onClick exactly as if this pan handling weren't here at all.
  const DRAG_THRESHOLD_PX = 4;

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    dragStart.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      cameraX: camera.x,
      cameraY: camera.y,
      pointerId: event.pointerId,
      captured: false,
    };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragStart.current;
    if (!drag) return;
    const scale = fitScale();
    const dxClient = event.clientX - drag.clientX;
    const dyClient = event.clientY - drag.clientY;
    if (!drag.captured) {
      if (Math.hypot(dxClient, dyClient) < DRAG_THRESHOLD_PX) return;
      event.currentTarget.setPointerCapture(drag.pointerId);
      drag.captured = true;
      setIsDragging(true);
    }
    setCamera((prev) => ({ ...prev, x: drag.cameraX + dxClient / scale, y: drag.cameraY + dyClient / scale }));
  }

  function handlePointerUp() {
    dragStart.current = null;
    setIsDragging(false);
  }

  // Wired up as a genuine (non-passive) native listener rather than React's own onWheel prop
  // — React attaches wheel listeners passively by default, which would silently swallow the
  // preventDefault() below and let the page scroll underneath the canvas while the reader is
  // trying to zoom it instead.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function onWheel(event: globalThis.WheelEvent) {
      event.preventDefault();
      const point = clientToViewBox(event.clientX, event.clientY);
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      setCamera((prev) => zoomTowardPoint(prev, point, factor));
    }
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgRef]);

  function focusOn(point: Point) {
    setCamera(cameraCenteredOn(point, FOCUS_SCALE));
  }

  function resetToOverview() {
    setCamera(OVERVIEW_CAMERA);
  }

  return { camera, isDragging, focusOn, resetToOverview, handlePointerDown, handlePointerMove, handlePointerUp };
}
