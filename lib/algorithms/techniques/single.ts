import { popcount9 } from "@/lib/algorithms/techniques/helper";
import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/** シングル（候補が 1 つだけの空マス）があればその 1 手（先頭のマス 1 のみ） */
export function trySingleStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  // 見つかったシングルを 1 回だけで終わらせず、
  // 候補更新によって新たにシングルが生まれなくなるまで適用してから返す。
  let nextGrid = grid;
  const values = [...grid.values()];
  const changedCells: number[] = [];

  while (true) {
    let didChange = false;

    for (let i = 0; i < 81; i++) {
      if (values[i] !== 0) continue;

      const m = nextGrid.cellAt(i).memoMask;
      if (popcount9(m) !== 1) continue;

      // `memoMask` が 1-bit なので、そのビットに対応する数字へ変換する。
      let digit = 0;
      for (let d = 1; d <= 9; d++) {
        if (m & (1 << (d - 1))) {
          digit = d;
          break;
        }
      }

      const before = nextGrid;
      nextGrid = nextGrid.placeDigit(i, digit).next;
      if (nextGrid !== before) {
        values[i] = digit;
        changedCells.push(i);
        didChange = true;
      }
    }

    if (!didChange) break;
  }

  if (changedCells.length === 0) return null;
  return { cellIndex: changedCells, grid: nextGrid };
}
