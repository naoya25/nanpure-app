import { PUZZLE_LEVEL_MAX, PUZZLE_LEVEL_MIN } from "@/lib/types/puzzle";

/** `computeSudokuDifficultyScore` の戻りなどを `PUZZLE_LEVEL_MIN`..`PUZZLE_LEVEL_MAX` に収める */
export function clampScoreToPuzzleLevel(score: number): number {
  const n = Math.round(score);
  return Math.max(PUZZLE_LEVEL_MIN, Math.min(PUZZLE_LEVEL_MAX, n));
}
