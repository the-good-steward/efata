/**
 * The Efata mark: the ichthys drawn as two arcs with the head left
 * open, and a sea-glass dot in front of the mouth.
 *
 * The gap is the idea — Ephphatha, "be opened" — so the mouth is never
 * closed and the body is never filled. Stroke weight increases as the
 * mark shrinks so the arcs hold at small sizes, and below 20px the dot
 * is dropped: at that size it reads as noise, and the mouth gap alone
 * carries the meaning. Never rendered below 16px.
 */
function strokeFor(size: number): number {
  if (size <= 16) return 15;
  if (size <= 32) return 13;
  if (size <= 52) return 10;
  return 9;
}

export function Mark({
  size = 40,
  className = "",
  /** Set on light backgrounds; uses Dusk and Deep sea glass instead. */
  onLight = true,
}: {
  size?: number;
  className?: string;
  onLight?: boolean;
}) {
  const stroke = strokeFor(size);
  const showDot = size >= 20;
  const height = Math.round(size * (100 / 130));

  return (
    <svg
      viewBox="0 0 130 100"
      width={size}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Efata"
      className={className}
    >
      <g
        fill="none"
        stroke={onLight ? "#1C2B33" : "#F5F1E8"}
        strokeWidth={stroke}
        strokeLinecap="round"
      >
        <path d="M10,78 C36,22 74,20 96,42" />
        <path d="M10,22 C36,78 74,80 96,58" />
      </g>
      {showDot && (
        <circle cx="112" cy="50" r="6" fill={onLight ? "#275F61" : "#8FAFAE"} />
      )}
    </svg>
  );
}

/**
 * Primary lockup: mark plus lowercase wordmark, Source Serif 4 at 600.
 * The gap matches the height of the mouth opening.
 */
export function Wordmark({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Mark size={size} />
      <span
        className="font-serif text-ink"
        style={{ fontWeight: 600, fontSize: size * 0.62 }}
      >
        efata
      </span>
    </span>
  );
}
