// Overlay HUD elements drawn on top of Mastery Mode's canvas scene — the "Shore" finish
// marker and the gap-distance meter — kept separate from masteryCanvasBackground.ts since
// these are UI reads rather than part of the environment itself.
import { MASTERY_COLORS } from "@/lib/masteryCanvasTheme";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawShoreMarker(ctx: CanvasRenderingContext2D, width: number, y: number, dark: boolean): void {
  const textColor = dark ? MASTERY_COLORS.hudTextDark : MASTERY_COLORS.hudText;
  ctx.save();
  ctx.strokeStyle = textColor;
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.12, y);
  ctx.lineTo(width * 0.88, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = textColor;
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SHORE", width / 2, y - 8);
  ctx.restore();
}

export function drawGapMeter(ctx: CanvasRenderingContext2D, width: number, proximity: number, dark: boolean): void {
  const textColor = dark ? MASTERY_COLORS.hudTextDark : MASTERY_COLORS.hudText;
  const barWidth = 56;
  const x = width - barWidth - 12;
  const y = 12;

  ctx.save();
  ctx.fillStyle = textColor;
  ctx.font = "700 9px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("GAP", x + barWidth, y + 8);

  ctx.fillStyle = dark ? "rgba(168,162,158,0.25)" : "rgba(120,113,108,0.25)";
  roundedRect(ctx, x, y + 12, barWidth, 5, 2.5);
  ctx.fill();

  const filled = Math.max(0, 1 - proximity) * barWidth;
  ctx.fillStyle = proximity > 0.7 ? MASTERY_COLORS.chariotAccent : MASTERY_COLORS.runnerAccent;
  roundedRect(ctx, x, y + 12, filled, 5, 2.5);
  ctx.fill();
  ctx.restore();
}
