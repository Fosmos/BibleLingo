"use client";

import { useEffect, useRef } from "react";

const STROKE_COLOR = "#1c1917";
const STROKE_WIDTH = 5;

export interface DrawingCanvasHandlers {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
}

// Freehand ink capture via the Pointer Events API, which already unifies mouse, touch
// (finger), and stylus (Apple Pencil) input under one event model — no separate touch/mouse
// handling needed. The canvas's backing store is scaled to devicePixelRatio once on mount so
// strokes stay crisp on retina displays, the same pattern MasteryTrack's game canvas uses.
export function useDrawingCanvas(): DrawingCanvasHandlers {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>): void {
    canvasRef.current?.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>): void {
    if (!drawingRef.current || !lastPointRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = getPoint(event);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function onPointerUp(): void {
    drawingRef.current = false;
    lastPointRef.current = null;
  }

  return { canvasRef, onPointerDown, onPointerMove, onPointerUp };
}
