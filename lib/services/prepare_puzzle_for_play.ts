import { computeSudokuDifficultyScore } from "@/lib/algorithms/sudoku_difficulty_score";
import { sudokuSolutionCountKind } from "@/lib/algorithms/sudoku_solver";
import { summarizeTechniqueAutoRunFromStrings } from "@/lib/models/puzzle_technique_run_analysis";
import { takeOne } from "@/lib/storage/puzzle_stock";
import { DEFAULT_DIFFICULTY_PERCENT } from "@/lib/types/puzzle";
import type { DifficultyPercent, Puzzle } from "@/lib/types/puzzle";
import { clampScoreToPuzzleLevel } from "@/lib/utils/puzzle_level";
import { requestGeneratedPuzzle } from "@/lib/workers/generate_puzzle_client";

export type PreparePuzzleForPlayResult =
  | { outcome: "ok"; puzzle: Puzzle }
  | { outcome: "invalid_shared_puzzle" }
  | { outcome: "generation_failed" };

function levelForSolvedPuzzle(puzzle81: string, solution81: string): number {
  const summary = summarizeTechniqueAutoRunFromStrings(puzzle81, solution81);
  const score = computeSudokuDifficultyScore({
    techniqueStepCounts: summary.techniqueStepCounts,
    solved: summary.solved,
    ...(summary.solved ? {} : { emptyCellsRemaining: summary.empty_cells_remaining }),
  });
  return clampScoreToPuzzleLevel(score.difficultyScore100);
}

function resolveSharedPuzzle(puzzle81: string): PreparePuzzleForPlayResult {
  const kind = sudokuSolutionCountKind(puzzle81);
  if (kind.kind !== "unique") {
    return { outcome: "invalid_shared_puzzle" };
  }
  return {
    outcome: "ok",
    puzzle: {
      puzzle_81: puzzle81,
      solution_81: kind.solution81,
      level: levelForSolvedPuzzle(puzzle81, kind.solution81),
      difficultyPercent: DEFAULT_DIFFICULTY_PERCENT,
    },
  };
}

export async function preparePuzzleForPlay(
  sharedPuzzle81: string | null,
  difficultyPercent: DifficultyPercent,
): Promise<PreparePuzzleForPlayResult> {
  if (sharedPuzzle81) {
    return resolveSharedPuzzle(sharedPuzzle81);
  }

  const stocked = takeOne(difficultyPercent);
  if (stocked) {
    return { outcome: "ok", puzzle: stocked };
  }

  try {
    const generated = await requestGeneratedPuzzle(difficultyPercent);
    return { outcome: "ok", puzzle: generated };
  } catch {
    return { outcome: "generation_failed" };
  }
}
