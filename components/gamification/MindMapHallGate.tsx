interface MindMapHallGateProps {
  // Where the path meets the top edge of the hall's card — the gate stands centered over it.
  cx: number;
  top: number;
}

// Fixed size, whatever the card's width.
const HALF_SPAN_PX = 15;
const PILLAR_HEIGHT_PX = 14;

// The hall's gateway, standing on top of its card right where the path arrives: two brass pillars with capstones,
// joined by an arch with a keystone — so each hall reads as a doorway into that room. Always the
// same size. Drawn inside MindMapLinks.tsx's SVG, with its pillars' feet tucked just under the
// card's top edge.
export function MindMapHallGate({ cx, top }: MindMapHallGateProps) {
  const pillarTop = top - PILLAR_HEIGHT_PX;
  return (
    <g aria-hidden="true">
      <path
        d={`M${cx - HALF_SPAN_PX},${pillarTop} A${HALF_SPAN_PX} ${HALF_SPAN_PX - 3} 0 0 1 ${cx + HALF_SPAN_PX},${pillarTop}`}
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        className="stroke-[#8B6B57] dark:stroke-[#a3856c]"
      />
      <rect x={cx - 3} y={pillarTop - HALF_SPAN_PX + 1} width={6} height={6} rx={1} className="fill-[#6f5445] dark:fill-[#c0a080]" />
      {[cx - HALF_SPAN_PX, cx + HALF_SPAN_PX].map((pillarX) => (
        <g key={pillarX}>
          <rect x={pillarX - 2.5} y={pillarTop} width={5} height={PILLAR_HEIGHT_PX + 3} rx={1} className="fill-[#8B6B57] dark:fill-[#a3856c]" />
          <rect x={pillarX - 4.5} y={pillarTop - 1.5} width={9} height={3} rx={1} className="fill-[#6f5445] dark:fill-[#c0a080]" />
        </g>
      ))}
    </g>
  );
}
