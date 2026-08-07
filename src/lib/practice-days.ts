/**
 * Days practised out of the last fourteen.
 *
 * Deliberately not a streak. A streak works by loss aversion, and its
 * failure mode is that missing one day resets it to zero, which is
 * usually the moment someone stops altogether. That is a poor fit for
 * an app whose whole design avoids telling anyone they failed, used by
 * people who already underrate themselves.
 *
 * This drifts instead of collapsing, so returning on day three is as
 * easy as returning on day one, and someone who practises five days a
 * week forever is shown a real habit rather than a broken counter.
 */
export type PracticeDays = {
  daysPractised: number;
  window: number;
  practisedToday: boolean;
  /** Oldest first, for a small fourteen day strip. */
  days: { date: string; practised: boolean }[];
  note: string;
};

const WINDOW = 14;

export function buildPracticeDays(
  timestamps: string[],
  now = new Date(),
): PracticeDays {
  const practised = new Set(timestamps.map((t) => t.slice(0, 10)));

  const days: { date: string; practised: boolean }[] = [];
  for (let i = WINDOW - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, practised: practised.has(key) });
  }

  const count = days.filter((d) => d.practised).length;
  const today = days[days.length - 1].practised;

  return {
    daysPractised: count,
    window: WINDOW,
    practisedToday: today,
    days,
    note: noteFor(count, today),
  };
}

function noteFor(count: number, today: boolean): string {
  if (count === 0) return "Nothing yet. One drill takes about three minutes.";
  if (count === 1) return "One day in. The second is the one that matters.";
  if (count >= 12) return "Near enough every day. This is a habit now.";
  if (count >= 7) return "More days than not. That is the part that compounds.";
  if (today) return "Today is done. Come back tomorrow.";
  return "Pick it up again today and the number moves.";
}
