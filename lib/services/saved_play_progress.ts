import { PlayHistory } from "@/lib/models/play_history";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import {
  deletePlayProgress,
  loadPlayProgress,
  savePlayProgress,
} from "@/lib/storage/play_progress";
import { SUDOKU_CELLS } from "@/lib/validates/grid";

export function loadSavedPlay(
  puzzle81: string,
): { history: PlayHistory; mistakes: number } | null {
  const saved = loadPlayProgress(puzzle81);
  if (!saved) return null;
  if (saved.values81.length !== SUDOKU_CELLS) return null;
  if (saved.memoMasks81.length !== SUDOKU_CELLS) return null;
  const values = [...saved.values81].map((ch) => Number(ch));
  if (values.some((v) => !Number.isInteger(v) || v < 0 || v > 9)) return null;

  const grid = SudokuGrid.fromValuesAndCandidateMasks(values, saved.memoMasks81);
  return { history: PlayHistory.create(grid), mistakes: saved.mistakes };
}

export function savePlay(
  puzzle81: string,
  progress: {
    values: readonly number[];
    memoMasks81: readonly number[];
    mistakes: number;
  },
): void {
  savePlayProgress(puzzle81, {
    values81: progress.values.join(""),
    memoMasks81: [...progress.memoMasks81],
    mistakes: progress.mistakes,
  });
}

export function clearSavedPlay(puzzle81: string): void {
  deletePlayProgress(puzzle81);
}
