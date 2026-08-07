/**
 * Days practised in the last fourteen.
 *
 * Deliberately not a streak. A streak resets to zero on a missed day,
 * and for most people that is the moment they stop altogether, which
 * means the thing that brought them back becomes the reason they quit.
 * It also sits badly in an app that never grades anyone: a red zero
 * would be the one place it says you failed.
 *
 * This drifts instead of collapsing. Coming back on day three is as
 * easy as coming back on day one, and someone practising five days a
 * week forever is shown as consistent rather than as repeatedly
 * failing.
 */
export type PracticeDays = {
  /** Distinct days with at least one answer, within the window. */
  days: number;
  window: number;
  /** Whether today already counts. */
  today: boolean;
  /** One line describing the pattern, in the app's voice. */
  note: string;
  /** Oldest first, for a small strip of marks. */
  marks: boolean[];
};

const WINDOW = 14;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function buildPracticeDays(
  answeredAt: string[],
  now = new Date(),
): PracticeDays {
  const practised = new Set(answeredAt.map(dayKey));

  const marks: boolean[] = [];
  for (let i = WINDOW - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    marks.push(practised.has(d.toISOString().slice(0, 10)));
  }

  const days = marks.filter(Boolean).length;
  const today = marks[marks.length - 1];

  let note: string;
  if (days === 0) {
    note = "Nothing yet. One drill takes about three minutes.";
  } else if (days === 1) {
    note = today
      ? "First one done. Coming back tomorrow is the whole trick."
      : "One day so far. Pick it up again today and it starts to add up.";
  } else if (days >= 10) {
    note = "That is close to daily. This is the point where people notice the change on real calls.";
  } else if (days >= 5) {
    note = today
      ? "Steady. Most weeks with a few days in them beat one heavy week."
      : "Steady so far. Today would keep it going.";
  } else {
    note = today
      ? "Building. A few minutes on more days beats an hour on one."
      : "A few days in. Today is worth three minutes.";
  }

  return { days, window: WINDOW, today, note, marks };
}
