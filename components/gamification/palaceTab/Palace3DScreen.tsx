"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Footprints, Hammer, Route } from "lucide-react";
import type { Palace3D, Palace3DObject, Palace3DObjectKind, VerseSegment } from "@/types";
import { addObject, addRoom, createPalace, placeVerse, removeObject, updateObject } from "@/lib/palaceTab/palace3d/palaceEdits";
import type { PalaceScene } from "@/lib/palaceTab/palace3d/scene";
import { useProgressStore } from "@/store/useProgressStore";
import { Palace3DBuildTray, Palace3DObjectPanel, Palace3DRoomPicker, Palace3DVerseCard, Palace3DVersePicker } from "@/components/gamification/palaceTab/Palace3DPanels";
import { Palace3DVerseIcons } from "@/components/gamification/palaceTab/Palace3DVerseIcons";
import { PathViewSwitch } from "@/components/ui/PathViewSwitch";

interface Palace3DScreenProps {
  pathKey: string;
  pathLabel: string;
  verses: VerseSegment[];
}

const openingOf = (text: string) => {
  const words = text.trim().split(/\s+/);
  return words.length > 3 ? `${words.slice(0, 3).join(" ")}…` : words.join(" ");
};

// The experimental 3D tab: a memory palace built and walked in first person. Walk: tap the floor to
// go there, drag to look, tap an object to walk up to its verse, or step through your verses in
// order. Build: add objects and rooms, and put verses on them. The scene itself is lib/palace3d/scene.ts,
// loaded only here, since Three.js is large.
export function Palace3DScreen({ pathKey, pathLabel, verses }: Palace3DScreenProps) {
  const saved = useProgressStore((state) => state.palaces3d?.[pathKey]);
  const save = useProgressStore((state) => state.savePalace3D);
  const [fresh] = useState(() => createPalace(pathKey));
  const palace: Palace3D = saved ?? fresh;
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<PalaceScene | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [building, setBuilding] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"verse" | { gridX: number; gridZ: number } | null>(null);
  const real = useMemo(() => verses.filter((verse) => verse.text.trim()), [verses]);
  const verseById = useMemo(() => new Map(real.map((verse) => [verse.id, verse])), [real]);
  const labelOf = useCallback((id: string) => {
    const verse = verseById.get(id);
    return verse && { opening: openingOf(verse.text) };
  }, [verseById]);
  // The latest palace, for the scene's events, which only hook up once.
  const latest = useRef(palace);
  useEffect(() => {
    latest.current = palace;
  }, [palace]);

  useEffect(() => {
    let live = true;
    import("@/lib/palaceTab/palace3d/scene")
      .then(({ PalaceScene }) => {
        if (!live || !canvas.current) return;
        scene.current = new PalaceScene(canvas.current, latest.current, labelOf, {
          onSelect: setSelected,
          onAddRoom: (gridX, gridZ) => setSheet({ gridX, gridZ }),
          onMoveObject: (id, x, z) => save(updateObject(latest.current, id, { x, z })),
        });
        setReady(true);
      })
      .catch(() => setFailed(true));
    return () => {
      live = false;
      scene.current?.dispose();
      scene.current = null;
    };
    // The scene lives as long as the screen; later palaces reach it through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => scene.current?.setPalace(palace, labelOf), [palace, labelOf, ready]);
  useEffect(() => scene.current?.setBuilding(building), [building, ready]);
  useEffect(() => scene.current?.setSelected(selected), [selected, ready]);

  const object: Palace3DObject | undefined = palace.objects.find((candidate) => candidate.id === selected);
  const placed = useMemo(() => new Set(palace.objects.flatMap((candidate) => (candidate.verseId ? [candidate.verseId] : []))), [palace.objects]);
  // The placed verses in reading order — the route you walk to recite them.
  const route = useMemo(() => {
    const order = new Map(real.map((verse, at) => [verse.id, at]));
    return palace.objects.filter((candidate) => candidate.verseId && order.has(candidate.verseId)).sort((a, b) => order.get(a.verseId!)! - order.get(b.verseId!)!);
  }, [palace.objects, real]);
  const routeAt = object ? route.findIndex((candidate) => candidate.id === object.id) : -1;
  const goTo = (at: number) => {
    const next = route[(at + route.length) % route.length];
    if (!next) return;
    setSelected(next.id);
    scene.current?.walkToObject(next.id);
  };
  const add = (kind: Palace3DObjectKind) => {
    const spot = scene.current?.placementSpot();
    if (!spot) return;
    const made = addObject(palace, kind, spot.roomId, spot.x, spot.z);
    save(made.palace);
    setSelected(made.id);
  };
  const verse = object?.verseId ? verseById.get(object.verseId) : undefined;

  return (
    <div className="fixed inset-0 z-10 bg-zinc-950">
      <canvas ref={canvas} aria-label={`3D memory palace for ${pathLabel}`} className="h-full w-full touch-none" />
      <Palace3DVerseIcons verses={real.filter((candidate) => placed.has(candidate.id))} onPicture={(id, url) => scene.current?.setPicture(id, url)} />
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <PathViewSwitch dark className="pointer-events-auto" />
        <div className="pointer-events-auto flex rounded-full bg-zinc-950/60 p-1 backdrop-blur-md">
          <button type="button" aria-pressed={!building} onClick={() => setBuilding(false)} className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold ${building ? "text-zinc-200" : "bg-white text-zinc-900"}`}><Footprints size={14} strokeWidth={2.75} />Walk</button>
          <button type="button" aria-pressed={building} onClick={() => setBuilding(true)} className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-extrabold ${building ? "bg-white text-zinc-900" : "text-zinc-200"}`}><Hammer size={14} strokeWidth={2.75} />Build</button>
        </div>
      </header>
      {failed && <p className="absolute inset-x-6 top-1/3 text-center font-bold text-zinc-200">This device couldn&rsquo;t start the 3D view.</p>}
      <div className="absolute inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] mx-auto max-w-md">
        {sheet === "verse" && object ? (
          <Palace3DVersePicker verses={real} placed={placed} currentId={object.verseId} onClose={() => setSheet(null)} onPick={(id) => { save(placeVerse(palace, object.id, id)); setSheet(null); }} />
        ) : sheet && sheet !== "verse" ? (
          <Palace3DRoomPicker onClose={() => setSheet(null)} onPick={(style) => { save(addRoom(palace, style, sheet.gridX, sheet.gridZ)); setSheet(null); }} />
        ) : building && object ? (
          <Palace3DObjectPanel object={object} verse={verse} onChange={(change) => save(updateObject(palace, object.id, change))} onPickVerse={() => setSheet("verse")} onDelete={() => { save(removeObject(palace, object.id)); setSelected(null); }} onClose={() => setSelected(null)} />
        ) : building ? (
          <Palace3DBuildTray onAdd={add} />
        ) : verse ? (
          <Palace3DVerseCard verse={verse} position={`${routeAt + 1} of ${route.length} on your route`} onPrevious={() => goTo(routeAt - 1)} onNext={() => goTo(routeAt + 1)} />
        ) : route.length ? (
          <button type="button" onClick={() => goTo(0)} className="mx-auto flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-3 text-[13px] font-black text-white shadow-[0_3px_0_#8C491A]"><Route size={16} strokeWidth={2.75} />Walk your route</button>
        ) : (
          <p className="mx-auto w-fit rounded-full bg-zinc-950/60 px-4 py-2 text-center text-xs font-bold text-zinc-100 backdrop-blur-md">Drag to look, tap the floor to walk. Use Build to place verses.</p>
        )}
      </div>
    </div>
  );
}
