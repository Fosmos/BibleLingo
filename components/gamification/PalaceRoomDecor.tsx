import { box, iso, toPoints, wallQuad } from "@/lib/palaceRoomLayout";
import type { DecorKind, RoomTheme } from "@/lib/palaceRoomThemes";

interface PalaceRoomDecorProps {
  theme: RoomTheme;
}

const BOOK_COLORS = ["fill-brand-500", "fill-sage-600", "fill-sand-600", "fill-brand-300", "fill-sage-400"];

// What a room has on its walls (lib/palaceRoomThemes.ts's decor): a window, tall arched windows, a
// bookcase, a fireplace, hanging banners, columns or a painting — drawn on the wall behind the
// furniture, so each kind of room looks like itself.
export function PalaceRoomDecor({ theme }: PalaceRoomDecorProps) {
  return (
    <g>
      {theme.decor.map((kind) => (
        <Decor key={kind} kind={kind} />
      ))}
    </g>
  );
}

function Decor({ kind }: { kind: DecorKind }) {
  if (kind === "window")
    return (
      <>
        <polygon points={wallQuad([0.38, 0], [0.62, 0], 24, 56)} className="fill-sage-200 stroke-sand-400 dark:fill-sage-900 dark:stroke-zinc-600" strokeWidth={2} />
        <polyline points={toPoints([iso(0.5, 0, 24), iso(0.5, 0, 56)])} className="stroke-sand-400 dark:stroke-zinc-600" strokeWidth={1.5} fill="none" />
        <polyline points={toPoints([iso(0.38, 0, 40), iso(0.62, 0, 40)])} className="stroke-sand-400 dark:stroke-zinc-600" strokeWidth={1.5} fill="none" />
      </>
    );
  if (kind === "arches")
    return (
      <>
        {[0.32, 0.68].map((middle) => {
          const half = 0.07;
          const curve = Array.from({ length: 9 }, (_, step) => {
            const angle = (Math.PI * step) / 8;
            return iso(middle - half * Math.cos(angle), 0, 56 + 14 * Math.sin(angle));
          });
          const glass = toPoints([iso(middle - half, 0, 18), ...curve, iso(middle + half, 0, 18)]);
          return (
            <g key={middle}>
              <polygon points={glass} className="fill-brand-200 stroke-sand-500 dark:fill-brand-900 dark:stroke-zinc-600" strokeWidth={2.5} />
              <polyline points={toPoints([iso(middle, 0, 18), iso(middle, 0, 70)])} className="stroke-sand-500/80 dark:stroke-zinc-600" strokeWidth={1.2} fill="none" />
              <polyline points={toPoints([iso(middle - half, 0, 44), iso(middle + half, 0, 44)])} className="stroke-sand-500/80 dark:stroke-zinc-600" strokeWidth={1.2} fill="none" />
            </g>
          );
        })}
      </>
    );
  if (kind === "bookcase")
    return (
      <>
        <polygon points={wallQuad([0.05, 0], [0.3, 0], 0, 60)} className="fill-brand-700 dark:fill-brand-900" />
        {[4, 20, 36].map((shelf, row) =>
          Array.from({ length: 10 }, (_, book) => {
            const from = 0.065 + book * 0.022;
            const tall = 11 + ((book * 7 + row * 3) % 4);
            return <polygon key={`${shelf}-${book}`} points={wallQuad([from, 0], [from + 0.018, 0], shelf, shelf + tall)} className={BOOK_COLORS[(book + row * 2) % BOOK_COLORS.length]} />;
          }),
        )}
        {[3, 19, 35, 52].map((shelf) => (
          <polygon key={shelf} points={wallQuad([0.05, 0], [0.3, 0], shelf - 1.5, shelf)} className="fill-brand-800 dark:fill-brand-950" />
        ))}
      </>
    );
  if (kind === "fireplace") {
    const flame = iso(0.74, 0.02, 0);
    return (
      <>
        <polygon points={wallQuad([0.6, 0], [0.88, 0], 0, 40)} className="fill-sand-400 dark:fill-zinc-600" />
        <polygon points={wallQuad([0.57, 0], [0.91, 0], 40, 45)} className="fill-sand-500 dark:fill-zinc-500" />
        <polygon points={wallQuad([0.66, 0], [0.82, 0], 0, 27)} className="fill-sand-900 dark:fill-zinc-950" />
        <path d={`M${flame.x - 9} ${flame.y - 2} q2 -12 9 -18 q-1 8 4 10 q3 -6 2 -10 q7 8 3 18 z`} className="fill-brand-400" />
        <path d={`M${flame.x - 4} ${flame.y - 2} q1 -7 4 -10 q1 5 3 6 q2 3 -1 4 z`} className="fill-brand-200" />
      </>
    );
  }
  if (kind === "banners")
    return (
      <>
        {[0.18, 0.44].map((from) => {
          const to = from + 0.09;
          const emblem = iso(0, (from + to) / 2, 50);
          return (
            <g key={from}>
              <polygon points={toPoints([iso(0, from, 66), iso(0, to, 66), iso(0, to, 24), iso(0, (from + to) / 2, 31), iso(0, from, 24)])} className="fill-brand-600 dark:fill-brand-800" />
              <circle cx={emblem.x} cy={emblem.y} r={4} className="fill-sand-100/90 dark:fill-sand-300" />
            </g>
          );
        })}
      </>
    );
  if (kind === "columns")
    return (
      <>
        {[0.2, 0.5, 0.8].map((gx) => {
          const column = box(gx, 0.045, 0.035, 78);
          return (
            <g key={gx}>
              <polygon points={column.left} className="fill-sand-300 dark:fill-zinc-600" />
              <polygon points={column.right} className="fill-sand-200 dark:fill-zinc-500" />
              <polygon points={column.top} className="fill-sand-100 dark:fill-zinc-400" />
            </g>
          );
        })}
      </>
    );
  const sun = iso(0, 0.36, 46);
  return (
    <>
      <polygon points={wallQuad([0, 0.3], [0, 0.52], 26, 54)} className="fill-brand-700 dark:fill-brand-900" />
      <polygon points={wallQuad([0, 0.315], [0, 0.505], 29, 51)} className="fill-sage-200 dark:fill-sage-800" />
      <polygon points={toPoints([iso(0, 0.315, 29), iso(0, 0.4, 42), iso(0, 0.46, 35), iso(0, 0.505, 40), iso(0, 0.505, 29)])} className="fill-sage-500 dark:fill-sage-600" />
      <circle cx={sun.x} cy={sun.y} r={2.6} className="fill-brand-300" />
    </>
  );
}
