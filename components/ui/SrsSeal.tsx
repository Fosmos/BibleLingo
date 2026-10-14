import { SEAL_TIERS } from "@/lib/srsSeals";

interface SrsSealProps {
  // 1–6: the spaced-review box it stands for (lib/srsSeals.ts).
  tier: number;
  size: number;
}

const POINTS = 24;
// A rosette edge: alternating outer and inner points round the circle.
const EDGE = Array.from({ length: POINTS }, (_, index) => {
  const radius = index % 2 ? 42 : 50;
  const angle = (index / POINTS) * Math.PI * 2;
  return `${(50 + radius * Math.sin(angle)).toFixed(1)},${(50 - radius * Math.cos(angle)).toFixed(1)}`;
}).join(" ");
const STAR = Array.from({ length: 10 }, (_, index) => {
  const radius = index % 2 ? 9 : 20;
  const angle = (index / 10) * Math.PI * 2;
  return `${(50 + radius * Math.sin(angle)).toFixed(1)},${(52 - radius * Math.cos(angle)).toFixed(1)}`;
}).join(" ");

// A metallic seal for a spaced-review box — bronze, silver, gold, platinum, emerald, diamond.
export function SrsSeal({ tier, size }: SrsSealProps) {
  const seal = SEAL_TIERS[Math.min(Math.max(tier, 1), SEAL_TIERS.length) - 1];
  const id = `srs-seal-${seal.name.toLowerCase()}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${seal.name} seal (Box ${tier})`} className="shrink-0 drop-shadow-sm">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={seal.light} />
          <stop offset="0.55" stopColor={seal.base} />
          <stop offset="1" stopColor={seal.dark} />
        </linearGradient>
      </defs>
      <polygon points={EDGE} fill={`url(#${id})`} stroke={seal.dark} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={50} cy={50} r={30} fill="none" stroke="#fff" strokeOpacity={0.65} strokeWidth={4} />
      <polygon points={STAR} fill="#fff" fillOpacity={0.9} />
    </svg>
  );
}
