import { LEVELS, type Question } from "./types";

/**
 * The adaptive deck, ported from JobMagnet. Questions come one at a time, nearest to a target difficulty. Two
 * "got it" in a row raise the target; a "review again" lowers it. Only a fresh mark moves it, so re-marking a
 * question you already marked changes nothing.
 */
export type Mark = "got" | "again";

export interface DeckState {
  /** 0 basic, 1 intermediate, 2 advanced. */
  target: number;
  streak: number;
  /** Indexes into the round's question list, in the order they were shown. */
  order: number[];
}

export const newDeck = (): DeckState => ({ target: 0, streak: 0, order: [] });

/** The next unseen question: at the target difficulty if there is one, else the nearest to it. -1 when none are left. */
export function pick(questions: Pick<Question, "level">[], seen: number[], target: number, pool?: number[]): number {
  const taken = new Set(seen);
  const left = (pool ?? questions.map((_, i) => i))
    .filter((i) => !taken.has(i))
    .map((i) => [i, LEVELS.indexOf(questions[i].level)] as const);
  if (!left.length) return -1;
  left.sort((a, b) => Math.abs(a[1] - target) - Math.abs(b[1] - target) || a[0] - b[0]);
  return left[0][0];
}

/** The deck after a fresh mark. `shift` is +1 when it got harder, -1 when it eased off, 0 otherwise. */
export function afterMark(d: DeckState, mark: Mark): { deck: DeckState; shift: -1 | 0 | 1 } {
  if (mark === "got") {
    const streak = d.streak + 1;
    if (streak >= 2 && d.target < LEVELS.length - 1) return { deck: { ...d, target: d.target + 1, streak: 0 }, shift: 1 };
    return { deck: { ...d, streak }, shift: 0 };
  }
  if (d.target > 0) return { deck: { ...d, target: d.target - 1, streak: 0 }, shift: -1 };
  return { deck: { ...d, streak: 0 }, shift: 0 };
}
