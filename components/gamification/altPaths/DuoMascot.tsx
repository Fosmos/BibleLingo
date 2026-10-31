"use client";

// The path's lamb, standing beside the verse you're up to.
export function DuoMascot() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="trail-bob h-[60px] w-[60px] drop-shadow-[0_4px_2px_rgba(0,0,0,0.18)]">
      <rect x="20" y="46" width="6" height="13" rx="3" fill="#4A3F35" />
      <rect x="39" y="46" width="6" height="13" rx="3" fill="#4A3F35" />
      <g fill="#FFFDF7" stroke="#E4D9C6" strokeWidth="1.5">
        <circle cx="20" cy="36" r="10" />
        <circle cx="32" cy="31" r="12" />
        <circle cx="44" cy="36" r="10" />
        <circle cx="32" cy="43" r="12" />
      </g>
      <ellipse cx="15" cy="16" rx="7" ry="3.5" fill="#4A3F35" transform="rotate(-22 15 16)" />
      <ellipse cx="49" cy="16" rx="7" ry="3.5" fill="#4A3F35" transform="rotate(22 49 16)" />
      <ellipse cx="32" cy="22" rx="14" ry="15" fill="#4A3F35" />
      <circle cx="32" cy="9" r="7" fill="#FFFDF7" />
      <circle cx="25" cy="21" r="3" fill="#fff" />
      <circle cx="39" cy="21" r="3" fill="#fff" />
      <circle cx="26" cy="22" r="1.6" fill="#201E1D" />
      <circle cx="38" cy="22" r="1.6" fill="#201E1D" />
      <path d="M28 29 Q32 33 36 29" stroke="#F4C9B4" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
