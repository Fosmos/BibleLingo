"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface BodyPortalProps {
  children: ReactNode;
}

// Renders a full-screen overlay (`fixed inset-0`) straight into <body>. `fixed` only means "the
// viewport" when no ancestor has a transform, filter or backdrop-filter — the Mind Map lesson
// sheet slides in via a transform and its breadcrumb uses backdrop-blur, and either one turned a
// celebration or a popup mounted inside them into a box pinned to just that element instead of
// the middle of the screen. Every caller only mounts this after a client-side interaction, so
// there's never a server render to mismatch against.
export function BodyPortal({ children }: BodyPortalProps) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
