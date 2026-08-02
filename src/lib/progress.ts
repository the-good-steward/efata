/**
 * Progress derived from what was actually measured, not from activity.
 *
 * Deliberately no streaks, badges, or levels. Rewarding someone for
 * showing up is easy to game and stops meaning anything the first time
 * they notice their filler count has not moved. Everything here is
 * something they can verify by reading their own transcripts.
 */

export type AttemptPoint = {
  createdAt: string;
  fillerWords: number;
  wordCount: number;
  wordsPerMinute: number | null;
  substance: number | null;
  delivery: number | null;
  sessionQuestionId: string;
  attemptNumber: number;
  oneThing: string | null;
  hedging: string[];
};

export type Progress = {
  answers: number;
  questionsPractised: number;
  retriesTaken: number;
  retriesImproved: number;
  fillersPer100: { early: number | null; recent: number | null; series: number[] };
  pace: { early: number | null; recent: number | null; series: number[] };
  topHedges: { phrase: string; count: number }[];
  recentCues: string[];
};

const SAMPLE = 5;

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Early and recent must not overlap, or the comparison is between a set
 * and itself and will always read as "no change" — which is worse than
 * showing nothing, because it looks like a finding.
 */
function split(values: number[]): { early: number | null; recent: number | null } {
  if (values.length < SAMPLE * 2) return { early: null, recent: null };
  return {
    early: mean(values.slice(0, SAMPLE)),
    recent: mean(values.slice(-SAMPLE)),
  };
}

export function buildProgress(points: AttemptPoint[]): Progress {
  // Oldest first, so "early" and "recent" mean what they say.
  const ordered = [...points].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  const fillerRates = ordered
    .filter((p) => p.wordCount > 20)
    .map((p) => (p.fillerWords / p.wordCount) * 100);

  const paces = ordered
    .map((p) => p.wordsPerMinute)
    .filter((v): v is number => typeof v === "number" && v > 0);

  // Retries: did the second run beat the first on the same question?
  const byQuestion = new Map<string, AttemptPoint[]>();
  for (const point of ordered) {
    const list = byQuestion.get(point.sessionQuestionId) ?? [];
    list.push(point);
    byQuestion.set(point.sessionQuestionId, list);
  }

  let retriesTaken = 0;
  let retriesImproved = 0;
  for (const list of byQuestion.values()) {
    const sorted = list.sort((a, b) => a.attemptNumber - b.attemptNumber);
    for (let i = 1; i < sorted.length; i++) {
      retriesTaken++;
      const before = sorted[i - 1];
      const after = sorted[i];
      const substanceUp =
        after.substance != null &&
        before.substance != null &&
        after.substance > before.substance;
      const deliveryUp =
        after.delivery != null &&
        before.delivery != null &&
        after.delivery > before.delivery;
      if (substanceUp || deliveryUp) retriesImproved++;
    }
  }

  const hedgeCounts = new Map<string, number>();
  for (const point of ordered) {
    for (const phrase of point.hedging) {
      const key = phrase.trim().toLowerCase();
      if (!key) continue;
      hedgeCounts.set(key, (hedgeCounts.get(key) ?? 0) + 1);
    }
  }

  return {
    answers: ordered.length,
    questionsPractised: byQuestion.size,
    retriesTaken,
    retriesImproved,
    fillersPer100: { ...split(fillerRates), series: fillerRates },
    pace: { ...split(paces), series: paces },
    topHedges: [...hedgeCounts.entries()]
      .map(([phrase, count]) => ({ phrase, count }))
      .filter((h) => h.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
    recentCues: ordered
      .slice(-4)
      .reverse()
      .map((p) => p.oneThing)
      .filter((c): c is string => Boolean(c)),
  };
}
