"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BadgeIconName =
	| "K"
	| "star"
	| "crown"
	| "alien"
	| "accessibility"
	| "chefHat"
	| "rocket"
	| "bicycle"
	| "microphone"
	| "baseball"
	| "football"
	| "surfboard"
	| "golf"
	| "baseballBat"
	| "tennisRacket"
	| "bowArrow"
	| "chessPiece"
	| "book"
	| "threeLeafClover"
	| "crystalBall"
	| "dna"
	| "curlingStone"
	| "drumsticks"
	| "guitar"
	| "camera"
	| "piano"
	| "paintbrush"
	| "movieCamera"
	| "tv"
	| "soccerBall";

const BADGE_ICONS: BadgeIconName[] = [
	"K",
	"star",
	"crown",
	"alien",
	"accessibility",
	"chefHat",
	"rocket",
	"bicycle",
	"microphone",
	"baseball",
	"football",
	"surfboard",
	"golf",
	"baseballBat",
	"tennisRacket",
	"bowArrow",
	"chessPiece",
	"book",
	"threeLeafClover",
	"crystalBall",
	"dna",
	"curlingStone",
	"drumsticks",
	"guitar",
	"camera",
	"piano",
	"paintbrush",
	"movieCamera",
	"tv",
	"soccerBall",
];

function randomNextIcon(current: BadgeIconName): BadgeIconName {
  const pool = BADGE_ICONS.filter((icon) => icon !== current);
  return pool[Math.floor(Math.random() * pool.length)] ?? "K";
}

function BadgeGlyph({ icon, size }: { icon: BadgeIconName; size: number }) {
  const glyphSize = Math.max(12, Math.round(size * 0.62));
  const stroke = Math.max(1.6, Number((glyphSize * 0.11).toFixed(2)));

  if (icon === "K") {
	return (
	  <span
		className="font-serif-brand"
		style={{
		  fontSize: glyphSize,
		  lineHeight: 1,
		  fontWeight: 700,
		}}
	  >
		K
	  </span>
	);
  }

  const svgBase = {
	width: glyphSize,
	height: glyphSize,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: stroke,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
  };

  if (icon === "star") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M12 2.8l2.8 5.66 6.24.91-4.52 4.4 1.07 6.23L12 17.1 6.41 20l1.07-6.23-4.52-4.4 6.24-.91z" />
	  </svg>
	);
  }

  if (icon === "crown") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M3.2 7.5 8 12l4-6 4 6 4.8-4.5L19 20H5z" />
	  </svg>
	);
  }

  if (icon === "accessibility") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="12" cy="4.2" r="1.9" />
		<path d="M6.8 8.3h10.4" />
		<path d="M12 8.3v5.6" />
		<path d="M12 13.9 7.8 19" />
		<path d="M12 13.9 16.2 19" />
	  </svg>
	);
  }

  if (icon === "chefHat") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M6.2 10.2a3 3 0 1 1 1.7-5.5 3.7 3.7 0 0 1 6.2 1.1 2.9 2.9 0 1 1 3.9 4.4z" />
		<path d="M6.2 10.2h11.6v7.2H6.2z" />
		<path d="M9 13.4h6" />
	  </svg>
	);
  }

  if (icon === "rocket") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M14.7 3.3c2.8 1.1 4 3.3 4 6.2-2.9 0-5.1 1.2-6.2 4l-3.2-3.2c1.1-2.8 3.3-4 5.4-7z" />
		<circle cx="14.3" cy="8.6" r="1.3" />
		<path d="M9.3 10.8 6.2 12l1.2-3.1" />
		<path d="m12.2 13.7-1.5 4.8 4.8-1.5" />
	  </svg>
	);
  }

  if (icon === "bicycle") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="6" cy="16.8" r="3.2" />
		<circle cx="18" cy="16.8" r="3.2" />
		<path d="M6 16.8 10 9.5h4.2" />
		<path d="m12 16.8-2-7.3 5.2 7.3" />
		<path d="M14.2 9.5h3" />
	  </svg>
	);
  }

  if (icon === "microphone") {
	return (
	  <svg {...svgBase} aria-hidden>
		<rect x="9" y="3.6" width="6" height="10" rx="3" />
		<path d="M6.8 10.8a5.2 5.2 0 0 0 10.4 0" />
		<path d="M12 16v4.4" />
		<path d="M9.3 20.4h5.4" />
	  </svg>
	);
  }

  if (icon === "baseball") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="12" cy="12" r="7.4" />
		<path d="M8.3 5.7c1.2 1.3 1.8 2.7 1.8 4.3 0 1.6-.6 3-1.8 4.3" />
		<path d="M15.7 5.7c-1.2 1.3-1.8 2.7-1.8 4.3 0 1.6.6 3 1.8 4.3" />
	  </svg>
	);
  }

  if (icon === "football") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M7 16.5c3.2 2.2 6.8 2.2 10 0 2.2-3.2 2.2-6.8 0-10-3.2-2.2-6.8-2.2-10 0-2.2 3.2-2.2 6.8 0 10z" />
		<path d="M9.6 14.4h4.8" />
		<path d="M10.4 12.9v3" />
		<path d="M12 12.8v3.2" />
		<path d="M13.6 12.9v3" />
	  </svg>
	);
  }

  if (icon === "surfboard") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M12 2.8c3.9 2.7 5.6 7.1 5.6 9.2 0 4.7-2.1 7.9-5.6 9.2-3.5-1.3-5.6-4.5-5.6-9.2 0-2.1 1.7-6.5 5.6-9.2z" />
		<path d="M12 5.2v13.6" />
	  </svg>
	);
  }

  if (icon === "golf") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M10 3.5v13.2" />
		<path d="M10 4.2c3.6 1.3 4.7 3.2 0 4.8" />
		<path d="M6.5 20.2h7" />
		<circle cx="16.7" cy="17.2" r="1.6" />
	  </svg>
	);
  }

  if (icon === "baseballBat") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="m6.2 17.8 9.8-9.8" />
		<path d="m15.1 7.1 2.2-2.2" />
		<path d="M5 19.1a1.7 1.7 0 1 0 2.4-2.4" />
		<path d="M17.1 5.1c1.3.4 1.8.9 2.2 2.2" />
	  </svg>
	);
  }

  if (icon === "tennisRacket") {
	return (
	  <svg {...svgBase} aria-hidden>
		<ellipse cx="11" cy="9.3" rx="4.4" ry="5.2" />
		<path d="m13.7 13.4 4.2 4.2" />
		<path d="m17.9 17.6 1.5 1.5" />
		<path d="M9.3 6.8v5" />
		<path d="M12.7 6.8v5" />
		<path d="M8.2 8.6h5.6" />
		<path d="M8.2 10.8h5.6" />
	  </svg>
	);
  }

  if (icon === "bowArrow") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M7 18c5.3-1.2 8.2-4.1 9.4-9.4" />
		<path d="M7 18c.2-4.2 1.7-6.7 5.8-10.8" />
		<path d="M15.9 8.2h4.1" />
		<path d="m18.4 5.7 2.5 2.5-2.5 2.5" />
	  </svg>
	);
  }

  if (icon === "chessPiece") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="12" cy="4.8" r="1.6" />
		<path d="M10.3 8.1h3.4" />
		<path d="M8.4 8.1c0 2.8 1.1 4.5 2.1 6.1H8l-1.1 3.5h10.2L16 14.2h-2.5c1-1.6 2.1-3.3 2.1-6.1" />
		<path d="M6.5 20.2h11" />
	  </svg>
	);
  }

  if (icon === "book") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M4.5 5.5h6.8a2 2 0 0 1 2 2v10.8H6.2a1.7 1.7 0 0 0-1.7 1.7z" />
		<path d="M19.5 5.5h-6.8a2 2 0 0 0-2 2v10.8h7.1a1.7 1.7 0 0 1 1.7 1.7z" />
	  </svg>
	);
  }

  if (icon === "threeLeafClover") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="9" cy="8.5" r="3" />
		<circle cx="15" cy="8.5" r="3" />
		<circle cx="12" cy="13.6" r="3" />
		<path d="M12 16.6c-.2 2.2-.9 3.8-2.3 4.9" />
	  </svg>
	);
  }

  if (icon === "crystalBall") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="12" cy="10.2" r="5.3" />
		<path d="M8 17h8" />
		<path d="M6.7 20h10.6" />
		<path d="M9.1 8.7c1.2-1.5 2.9-2.1 4.9-1.9" />
	  </svg>
	);
  }

  if (icon === "dna") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M8 4.1c4.8 3.1 4.8 12.7 0 15.8" />
		<path d="M16 4.1c-4.8 3.1-4.8 12.7 0 15.8" />
		<path d="M9 7.1h6" />
		<path d="M8.6 11.1h6.8" />
		<path d="M9 15h6" />
	  </svg>
	);
  }

  if (icon === "curlingStone") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M8.7 6.1h6.6" />
		<path d="M9.8 6.1V4.8h4.4v1.3" />
		<path d="M5.7 11.6a6.3 5.3 0 1 0 12.6 0" />
	  </svg>
	);
  }

  if (icon === "drumsticks") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="m6.2 17.8 5.9-5.9" />
		<path d="m11.9 17.8 5.9-5.9" />
		<circle cx="5.2" cy="18.8" r="1.5" />
		<circle cx="18.8" cy="11.2" r="1.5" />
	  </svg>
	);
  }

  if (icon === "guitar") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M14.7 5.2h3" />
		<path d="M14.7 7h2.3" />
		<path d="M11.5 9.4a3.9 3.9 0 1 0 3.1 3.1l4.1-4.1-2.3-2.3z" />
		<circle cx="11.1" cy="13" r="1.1" />
	  </svg>
	);
  }

  if (icon === "camera") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M5.1 8.5h13.8a1.6 1.6 0 0 1 1.6 1.6v7.4a1.6 1.6 0 0 1-1.6 1.6H5.1a1.6 1.6 0 0 1-1.6-1.6v-7.4a1.6 1.6 0 0 1 1.6-1.6z" />
		<circle cx="12" cy="13.1" r="3.2" />
		<path d="M8.3 8.5 9.4 6.4h5.2l1.1 2.1" />
	  </svg>
	);
  }

  if (icon === "piano") {
	return (
	  <svg {...svgBase} aria-hidden>
		<rect x="4.6" y="6" width="14.8" height="12" rx="1.5" />
		<path d="M7.2 10.2v7.8" />
		<path d="M10.1 10.2v7.8" />
		<path d="M13 10.2v7.8" />
		<path d="M15.9 10.2v7.8" />
		<rect x="6.2" y="6.6" width="1.4" height="3.3" fill="currentColor" stroke="none" />
		<rect x="9.1" y="6.6" width="1.4" height="3.3" fill="currentColor" stroke="none" />
		<rect x="12" y="6.6" width="1.4" height="3.3" fill="currentColor" stroke="none" />
		<rect x="14.9" y="6.6" width="1.4" height="3.3" fill="currentColor" stroke="none" />
	  </svg>
	);
  }

  if (icon === "paintbrush") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="m7.1 15.8 7.7-7.7 2.1 2.1-7.7 7.7" />
		<path d="M14.8 8.1 17 6a2 2 0 0 1 2.8 2.8l-2.1 2.1" />
		<path d="M5.8 18.8c1.5-.1 2.7.3 3.8 1.4-1.8.6-3.2.4-4.6-.4z" />
	  </svg>
	);
  }

  if (icon === "movieCamera") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="8.1" cy="7.1" r="2" />
		<circle cx="13.2" cy="7.1" r="2" />
		<rect x="4.8" y="10" width="10.7" height="7.6" rx="1.2" />
		<path d="m15.5 12.1 3.7-1.9v7.2l-3.7-1.9" />
	  </svg>
	);
  }

  if (icon === "tv") {
	return (
	  <svg {...svgBase} aria-hidden>
		<rect x="4" y="6.7" width="16" height="10.4" rx="1.7" />
		<path d="M12 6.7 9.4 4.1" />
		<path d="M12 6.7 14.6 4.1" />
		<path d="M9.2 20h5.6" />
	  </svg>
	);
  }

  if (icon === "soccerBall") {
	return (
	  <svg {...svgBase} aria-hidden>
		<circle cx="12" cy="12" r="7.6" />
		<path d="m12 8.6 2 1.5-.8 2.4h-2.4l-.8-2.4z" />
		<path d="m12 8.6-2.6-1.1-1.7 1.7.5 2.3" />
		<path d="m12 8.6 2.6-1.1 1.7 1.7-.5 2.3" />
		<path d="m8.2 11.5-1.8 2 .8 2.5 2.4.5" />
		<path d="m15.8 11.5 1.8 2-.8 2.5-2.4.5" />
	  </svg>
	);
  }

  if (icon === "alien") {
	return (
	  <svg {...svgBase} aria-hidden>
		<path d="M12 3.1c4.4 0 7.1 3.5 7.1 7.5 0 4.3-3.2 8.4-7.1 10.3-3.9-1.9-7.1-6-7.1-10.3C4.9 6.6 7.6 3.1 12 3.1z" />
		<ellipse cx="9.1" cy="11.2" rx="1.8" ry="1.2" fill="currentColor" stroke="none" />
		<ellipse cx="14.9" cy="11.2" rx="1.8" ry="1.2" fill="currentColor" stroke="none" />
	  </svg>
	);
  }

  return (
	<svg {...svgBase} aria-hidden>
	  <circle cx="12" cy="12" r="7.5" />
	  <circle cx="12" cy="12" r="1.6" />
	  <path d="M12 3v3" />
	  <path d="M12 18v3" />
	  <path d="M3 12h3" />
	  <path d="M18 12h3" />
	</svg>
  );
}

export function KBadge({ size = 32 }: { size?: number }) {
  const [icon, setIcon] = useState<BadgeIconName>("K");
  const glyphRef = useRef<HTMLSpanElement>(null);
  const animationTick = useMemo(() => icon, [icon]);

  useEffect(() => {
	const timer = setInterval(() => {
	  setIcon((current) => randomNextIcon(current));
	}, 5000);

	return () => clearInterval(timer);
  }, []);

  useEffect(() => {
	const el = glyphRef.current;
	if (!el) return;

	el.animate(
	  [
		{ transform: "translateY(2px) scale(0.55) rotate(-16deg)", opacity: 0, filter: "blur(5px)" },
		{ transform: "translateY(-1px) scale(1.08) rotate(7deg)", opacity: 1, filter: "blur(0px)", offset: 0.66 },
		{ transform: "translateY(0) scale(1) rotate(0deg)", opacity: 1, filter: "blur(0px)" },
	  ],
	  {
		duration: 430,
		easing: "cubic-bezier(0.2, 0.85, 0.18, 1)",
	  }
	);
  }, [animationTick]);

  return (
	<span
	  aria-hidden
	  className="inline-flex items-center justify-center bg-coral text-bg select-none"
	  style={{
		width: size,
		height: size,
		borderRadius: Math.max(6, Math.round(size * 0.3)),
	  }}
	>
	  <span ref={glyphRef} className="inline-flex items-center justify-center">
		<BadgeGlyph icon={icon} size={size} />
	  </span>
	</span>
  );
}

export function Wordmark({ className = "text-base" }: { className?: string }) {
  return <span className={`wordmark text-cream ${className}`}>Kleos</span>;
}
