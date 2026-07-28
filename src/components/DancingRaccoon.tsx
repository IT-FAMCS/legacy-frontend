type DancingRaccoonVariant = "disco" | "groove" | "twist";

interface DancingRaccoonProps {
  variant: DancingRaccoonVariant;
}

// Hand-drawn SVG raccoon for the landing-page easter egg (5 clicks on the
// subtitle). Body parts are separate groups so each can be animated on its
// own keyframe timing (see globals.css) instead of transforming one static
// image three different ways.
export function DancingRaccoon({ variant }: DancingRaccoonProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2000,
        pointerEvents: "none",
        filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.5))",
      }}
      className="raccoon-appear"
    >
      <svg className={`raccoon variant-${variant}`} viewBox="0 0 200 220" width="200" height="220">
        <g className="part tail">
          <path d="M150 150 Q192 128 186 88 Q183 68 165 63 Q179 84 173 105 Q169 126 145 141 Z" fill="#6b6b74" />
          <path d="M160 141 Q176 120 173 99" stroke="#3a3a40" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M169 116 Q180 99 178 83" stroke="#3a3a40" strokeWidth="9" strokeLinecap="round" fill="none" />
        </g>
        <g className="part leg-l">
          <rect x="78" y="168" width="18" height="34" rx="9" fill="#6b6b74" />
          <ellipse cx="87" cy="204" rx="12" ry="7" fill="#2b2b30" />
        </g>
        <g className="part leg-r">
          <rect x="104" y="168" width="18" height="34" rx="9" fill="#6b6b74" />
          <ellipse cx="113" cy="204" rx="12" ry="7" fill="#2b2b30" />
        </g>
        <g className="part torso">
          <ellipse cx="100" cy="145" rx="44" ry="50" fill="#8a8a92" />
          <ellipse cx="100" cy="158" rx="26" ry="32" fill="#d8d3c8" />
          {variant === "twist" && (
            <>
              <path d="M85 107 L100 112 L85 117 Z M115 107 L100 112 L115 117 Z" fill="#686ACF" />
              <circle cx="100" cy="112" r="4" fill="#4d4fa0" />
            </>
          )}
        </g>
        <g className="part arm-l">
          <rect x="52" y="112" width="16" height="46" rx="8" fill="#8a8a92" />
          <circle cx="60" cy="160" r="11" fill="#2b2b30" />
          {variant === "disco" && <rect x="50" y="150" width="20" height="8" rx="4" fill="#d4af37" />}
        </g>
        <g className="part arm-r">
          <rect x="132" y="112" width="16" height="46" rx="8" fill="#8a8a92" />
          <circle cx="140" cy="160" r="11" fill="#2b2b30" />
          {variant === "disco" && <rect x="130" y="150" width="20" height="8" rx="4" fill="#d4af37" />}
        </g>
        <g className="part head">
          <circle className="ear ear-l" cx="70" cy="34" r="14" fill="#6b6b74" />
          <circle className="ear ear-r" cx="130" cy="34" r="14" fill="#6b6b74" />
          <circle cx="100" cy="62" r="44" fill="#8a8a92" />
          <ellipse cx="100" cy="80" rx="26" ry="20" fill="#d8d3c8" />
          <path
            className="mask"
            d="M58 58 C66 44 84 42 100 52 C116 42 134 44 142 58 C136 74 120 78 100 70 C80 78 64 74 58 58 Z"
            fill="#2b2b30"
          />
          {variant !== "twist" && (
            <>
              <circle cx="86" cy="58" r="5" fill="#fff" />
              <circle cx="114" cy="58" r="5" fill="#fff" />
              <circle cx="87" cy="59" r="2.2" fill="#1a1a1d" />
              <circle cx="113" cy="59" r="2.2" fill="#1a1a1d" />
            </>
          )}
          {variant === "twist" && (
            <>
              <rect x="76" y="51" width="22" height="14" rx="4" fill="#111" />
              <rect x="102" y="51" width="22" height="14" rx="4" fill="#111" />
              <rect x="96" y="56" width="8" height="4" fill="#111" />
            </>
          )}
          <path d="M96 84 L104 84 L100 90 Z" fill="#1a1a1d" />
          {variant === "disco" && <rect x="60" y="24" width="80" height="10" rx="5" fill="#d4af37" />}
          {variant === "groove" && <ellipse cx="100" cy="93" rx="6" ry="8" fill="#e8879a" />}
        </g>
      </svg>
    </div>
  );
}
