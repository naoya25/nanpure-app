import { generateSudokuPuzzlePair } from "@/lib/algorithms/generate_sudoku";
import { computeSudokuDifficultyScore } from "@/lib/algorithms/sudoku_difficulty_score";
import { summarizeTechniqueAutoRunFromStrings } from "@/lib/models/puzzle_technique_run_analysis";
import type { Puzzle } from "@/lib/types/puzzle";
import { clampScoreToPuzzleLevel } from "@/lib/utils/puzzle_level";

const MAX_GENERATE_ATTEMPTS = 50;

/**
 * 1 問生成してレベルまで算出する同期処理。
 * 実測で中央値 約300ms・最大 2283ms かかるため、呼び出し側は Worker に逃がすこと
 * （`generate_puzzle_client.ts`）。Worker が使えない環境のフォールバックでも同じ関数を使う。
 */
export function generatePuzzleSync(random: () => number = Math.random): Puzzle | null {
  let pair = null;
  for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS && pair === null; attempt++) {
    pair = generateSudokuPuzzlePair(random);
  }
  if (pair === null) return null;

  const summary = summarizeTechniqueAutoRunFromStrings(pair.puzzle_81, pair.solution_81);
  const score = computeSudokuDifficultyScore({
    techniqueStepCounts: summary.techniqueStepCounts,
    solved: summary.solved,
    ...(summary.solved ? {} : { emptyCellsRemaining: summary.empty_cells_remaining }),
  });
  const level = clampScoreToPuzzleLevel(score.difficultyScore100);

  return { puzzle_81: pair.puzzle_81, solution_81: pair.solution_81, level };
}
