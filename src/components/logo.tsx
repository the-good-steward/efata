/**
 * The Efata mark: a fish with its mouth open, and the coin already out
 * of it.
 *
 * Drawn as a single open stroke rather than a closed silhouette — the
 * mouth staying open is the whole idea, so it must survive at favicon
 * size. The coin sits outside the mouth, not inside it: the thing has
 * already been given.
 *
 * NOTE: reconstructed from the brand guidelines, whose type and mark
 * were flattened to outlines and could not be extracted. Replace the
 * paths here with the official SVG export when it is available; nothing
 * else needs to change.
 */
export function Mark({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Body: sweeps from the open mouth around and back to the tail. */}
      <path
        d="M9 16c2.6-4.4 7.2-6.6 11.4-6.6 2.6 0 4.6.8 5.8 1.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 16c2.6 4.4 7.2 6.6 11.4 6.6 2.6 0 4.6-.8 5.8-1.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Tail. */}
      <path
        d="M26.2 11.3 30 8v16l-3.8-3.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The coin, already out. */}
      <circle cx="3.4" cy="16" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2.5 ${className}`}>
      <Mark size={22} className="translate-y-[3px]" />
      <span className="font-display text-parchment text-2xl tracking-tight">
        efata
      </span>
    </span>
  );
}
