import { popcount9 } from "@/lib/algorithms/techniques/helper";
import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/**
 * メモ1候補の確定（ペンシルマークが 1 桁だけの空マスを、そのメモの数字で確定する）。
 * ピアの確定数字から候補を再計算はしない。メモのビットがちょうど 1 つだけのときのみ適用する。
 */
export function tryMemoSingleStep(
  grid: SudokuGrid,
  solution81?: string,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const opsByCell = new Map<number, number>();

  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;

    const memoMask = grid.cellAt(i).memoMask & 0x1ff;
    if (popcount9(memoMask) !== 1) continue;

    let digit = 0;
    for (let d = 1; d <= 9; d++) {
      if (memoMask & (1 << (d - 1))) {
        digit = d;
        break;
      }
    }
    if (digit === 0) continue;

    const existing = opsByCell.get(i);
    if (existing !== undefined && existing !== digit) continue;
    opsByCell.set(i, digit);
  }

  if (opsByCell.size === 0) return null;

  let nextGrid = grid;
  const changedCells: number[] = [];
  for (const [cellIndex, digit] of opsByCell) {
    const before = nextGrid;
    nextGrid = nextGrid.placeDigit(cellIndex, digit, solution81).next;
    if (nextGrid !== before) changedCells.push(cellIndex);
  }

  if (changedCells.length === 0) return null;
  return { cellIndex: changedCells, grid: nextGrid };
}
