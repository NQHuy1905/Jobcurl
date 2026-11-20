// Original abstract art + accent palette. Saturated colours live only here (illustrations, avatars),
// never in text or chrome. All art is decorative (aria-hidden).

export const ACCENTS = [
  { bg: "#FF7A1A", fg: "#141414" }, // tangerine
  { bg: "#00A38D", fg: "#141414" }, // teal
  { bg: "#FF4F8B", fg: "#141414" }, // pink
  { bg: "#3D5AFE", fg: "#FFFFFF" }, // indigo
  { bg: "#FFC93C", fg: "#141414" }, // sun
  { bg: "#22B573", fg: "#141414" }, // green
];

// Pass a numeric id so neighbouring companies always get different colours.
export function accentFor(key = 0) {
  return ACCENTS[Math.abs(Number(key) || 0) % ACCENTS.length];
}

export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle cx="12" cy="16" r="10" fill="#FF7A1A" />
      <circle cx="20" cy="16" r="10" fill="#3D5AFE" style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}

export function HeroArt() {
  return (
    <svg viewBox="0 0 560 440" role="presentation" aria-hidden="true" focusable="false" className="art">
      <defs>
        <filter id="lift" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#141414" floodOpacity="0.16" />
        </filter>
      </defs>
      {/* back shapes */}
      <path d="M96 372V228a92 92 0 0 1 184 0v144Z" fill="#FFC93C" />
      <path d="M134 372V232a54 54 0 0 1 108 0v140Z" fill="#F1ECE4" />
      <circle cx="452" cy="118" r="68" fill="#00A38D" />
      <path d="M352 372a118 118 0 0 1 118-118h54v118Z" fill="#3D5AFE" />
      <circle cx="84" cy="104" r="36" fill="#FF4F8B" />
      <path d="M452 340c8-44 76-44 80 0 4 40-72 58-80 0Z" fill="#FF7A1A" />
      <path d="M40 318c-2-54 52-80 96-66 2 54-42 86-96 66Z" fill="#22B573" />
      <path d="M32 396C132 330 206 430 300 380S456 338 528 392" fill="none" stroke="#FFC93C" strokeWidth="14" strokeLinecap="round" />

      {/* resume sheet */}
      <g filter="url(#lift)" transform="rotate(6 392 168)">
        <rect x="332" y="86" width="132" height="164" rx="14" fill="#fff" />
        <circle cx="362" cy="120" r="14" fill="#FF4F8B" />
        <rect x="384" y="110" width="58" height="9" rx="4.5" fill="#141414" />
        <rect x="384" y="126" width="38" height="7" rx="3.5" fill="#B9B3A8" />
        <rect x="350" y="158" width="96" height="7" rx="3.5" fill="#E7E1D6" />
        <rect x="350" y="176" width="84" height="7" rx="3.5" fill="#E7E1D6" />
        <rect x="350" y="194" width="92" height="7" rx="3.5" fill="#E7E1D6" />
        <rect x="350" y="220" width="40" height="12" rx="6" fill="#22B573" />
      </g>

      {/* job cards */}
      <g filter="url(#lift)" transform="rotate(-4 285 238)">
        <rect x="196" y="186" width="178" height="98" rx="16" fill="#fff" />
        <circle cx="226" cy="216" r="14" fill="#FF7A1A" />
        <rect x="248" y="204" width="86" height="10" rx="5" fill="#141414" />
        <rect x="248" y="222" width="58" height="7" rx="3.5" fill="#B9B3A8" />
        <rect x="214" y="248" width="132" height="7" rx="3.5" fill="#E7E1D6" />
        <rect x="214" y="264" width="98" height="7" rx="3.5" fill="#E7E1D6" />
      </g>
      <g filter="url(#lift)" transform="rotate(3 300 322)">
        <rect x="226" y="292" width="170" height="82" rx="16" fill="#fff" />
        <circle cx="254" cy="320" r="13" fill="#00A38D" />
        <rect x="274" y="310" width="78" height="10" rx="5" fill="#141414" />
        <rect x="274" y="327" width="52" height="7" rx="3.5" fill="#B9B3A8" />
        <rect x="244" y="350" width="108" height="7" rx="3.5" fill="#E7E1D6" />
      </g>

      {/* score badge */}
      <g filter="url(#lift)">
        <circle cx="402" cy="262" r="38" fill="#141414" />
        <text x="398" y="276" textAnchor="middle" fontFamily="Outfit, system-ui, sans-serif" fontWeight="700" fontSize="40" fill="#fff">
          9
        </text>
        <text x="420" y="282" textAnchor="middle" fontFamily="Outfit, system-ui, sans-serif" fontWeight="600" fontSize="13" fill="#FFC93C">
          /10
        </text>
      </g>

      {/* sparkles + dots */}
      <path d="M236 90l7 18 18 7-18 7-7 18-7-18-18-7 18-7Z" fill="#141414" />
      <path d="M520 220l5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" fill="#FF4F8B" />
      <circle cx="170" cy="168" r="6" fill="#3D5AFE" />
      <circle cx="312" cy="62" r="7" fill="#FF7A1A" />
      <circle cx="500" cy="296" r="5" fill="#141414" />
      <circle cx="58" cy="226" r="5" fill="#FFC93C" />
    </svg>
  );
}

// Small colourful snippets for the first-run feature blocks.
export function TileArt({ kind }) {
  return (
    <svg viewBox="0 0 160 110" role="presentation" aria-hidden="true" focusable="false" className="tile-art">
      {kind === "watch" && (
        <>
          <circle cx="52" cy="62" r="40" fill="#FFC93C" />
          <path d="M96 110a58 58 0 0 1 58-58v58Z" fill="#00A38D" />
          <circle cx="86" cy="52" r="26" fill="#fff" stroke="#141414" strokeWidth="6" />
          <path d="M105 71l24 24" stroke="#141414" strokeWidth="9" strokeLinecap="round" />
          <circle cx="86" cy="52" r="8" fill="#FF4F8B" />
        </>
      )}
      {kind === "digest" && (
        <>
          <circle cx="132" cy="30" r="24" fill="#FF4F8B" />
          <path d="M8 96V52a24 24 0 0 1 24-24h96" fill="none" stroke="#3D5AFE" strokeWidth="12" strokeLinecap="round" />
          <rect x="30" y="40" width="96" height="62" rx="12" fill="#fff" stroke="#141414" strokeWidth="6" />
          <path d="M34 48l44 30 44-30" fill="none" stroke="#141414" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="116" cy="92" r="11" fill="#FF7A1A" />
        </>
      )}
      {kind === "match" && (
        <>
          <path d="M0 110a60 60 0 0 1 60-60h20v60Z" fill="#FF7A1A" />
          <circle cx="102" cy="56" r="40" fill="#22B573" />
          <circle cx="102" cy="56" r="28" fill="#fff" />
          <text x="102" y="68" textAnchor="middle" fontFamily="Outfit, system-ui, sans-serif" fontWeight="700" fontSize="34" fill="#141414">
            8
          </text>
          <circle cx="30" cy="30" r="10" fill="#3D5AFE" />
        </>
      )}
    </svg>
  );
}
