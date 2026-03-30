import { popcount9 } from "@/lib/algorithms/techniques/helper";
import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/** シングル（候補が 1 つだけの空マス）があればその 1 手（先頭のマス 1 のみ） */
export function trySingleStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  const values = grid.values();
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    const m = grid.cellAt(i).memoMask;
    if (popcount9(m) !== 1) continue;
    let digit = 0;
    for (let d = 1; d <= 9; d++) {
      if (m & (1 << (d - 1))) {
        digit = d;
        break;
      }
    }
    const next = grid.assignDeducedDigit(i, digit);
    if (next === grid) return null;
    return { cellIndex: [i], grid: next };
  }
  return null;
}
