"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import type { MindMapPericopeDatum } from "@/lib/mindMapTypes";
import type { LayoutPoint } from "@/lib/mindMapLayoutTypes";
import { useProgressStore } from "@/store/useProgressStore";
import { landmarkIconById } from "@/lib/landmarkIcons";
import { autoHallEmblem, hallEmblemKey } from "@/lib/hallEmblems";
import { hallPathStroke } from "@/lib/mindMapGenreColor";
import { mindMapTagKey } from "@/lib/mindMapTagKey";
import { NO_LOCATION_TAG_LEVELS } from "@/lib/locationTags";
import { MindMapHallEditor } from "@/components/gamification/MindMapHallEditor";

interface MindMapHallEmblemProps {
  pericope: MindMapPericopeDatum;
  hallNumber: number | undefined;
  // Where it stands on the canvas — in the open space beside the hall's verses (see
  // lib/mindMapHallGeometry.ts's hallEmblemPoint).
  // Its size scales with the hall's length (see hallEmblemPoint).
  point: LayoutPoint & { size: number };
}

// A hall's landmark, standing on the map beside its own verses — in the open space on the far side
// of their sweep — rather than squeezed into the hall's card: big enough to see from a distance,
// and set right next to the verses it marks. The emblem the reader chose, or until they do, one
// suggested by the hall's heading (see lib/hallEmblems.ts), drawn fainter as a suggestion. In the
// hall's own path colour, drawn as a free-standing symbol (no badge around it). Tapping it opens
// the hall editor (name, place tag, landmark).
export function MindMapHallEmblem({ pericope, hallNumber, point }: MindMapHallEmblemProps) {
  const chosen = landmarkIconById(useProgressStore((state) => state.iconTags[hallEmblemKey(pericope)]));
  const locationTagLevels = useProgressStore((state) => state.locationTagLevels) ?? NO_LOCATION_TAG_LEVELS;
  const [editing, setEditing] = useState(false);
  const shown = chosen ?? landmarkIconById(autoHallEmblem(pericope));

  return (
    <>
      <button
        type="button"
        onClick={(event: MouseEvent) => {
          event.stopPropagation();
          setEditing(true);
        }}
        aria-label={chosen ? `${pericope.label} landmark: ${chosen.label} (edit hall)` : `Choose a landmark for ${pericope.label}`}
        style={{ left: point.x, top: point.y, width: point.size, height: point.size, "--emblem": hallPathStroke(pericope) } as CSSProperties}
        className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[var(--emblem)] drop-shadow-sm ${chosen ? "" : "opacity-60"}`}
      >
        {shown && <shown.Icon size={point.size} strokeWidth={Math.max(1.25, 56 / point.size)} />}
      </button>
      {editing && (
        <MindMapHallEditor pericope={pericope} hallNumber={hallNumber} tagKey={mindMapTagKey(pericope, locationTagLevels)} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
