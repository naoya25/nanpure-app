import { PUZZLE_LEVEL_MAX, PUZZLE_LEVEL_MIN } from "@/lib/types/puzzle";

/** `computeSudokuDifficultyScore` の戻りなどを `puzzles.level` の CHECK 範囲に収める */
export function clampScoreToPuzzleLevel(score: number): number {
  const n = Math.round(score);
  return Math.max(PUZZLE_LEVEL_MIN, Math.min(PUZZLE_LEVEL_MAX, n));
}
