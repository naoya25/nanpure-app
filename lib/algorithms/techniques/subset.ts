import {
  hasEmptyCellWithoutMemo,
  makeGetMask,
  popcount9,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/**
 * ペア(2) / トリプル(3) / クァッド(4)。ユニット内の n マスで候補の和集合がちょうど n 種類 → 他マスからその n 数字の候補を削除。
 * 空マスでメモ未入力が 1 つでもあれば実行しない。
 *
 * 1 回の適用では行→列→ブロックの順で、最初に候補削除が起きるサブセット 1 件だけを行う。
 */
type SubsetSize = 2 | 3 | 4;

function forEachCombination(
  indices: readonly number[],
  n: number,
  visit: (comb: readonly number[]) => void,
): void {
  const k = indices.length;
  if (n > k) return;
  const pick: number[] = [];
  const rec = (start: number, depth: number) => {
    if (depth === n) {
      visit(pick.slice());
      return;
    }
    for (let i = start; i <= k - (n - depth); i++) {
      pick.push(indices[i]!);
      rec(i + 1, depth + 1);
      pick.pop();
    }
  };
  rec(0, 0);
}

function trySubsetEliminationAfterPencil(
  grid: SudokuGrid,
  subsetSize: SubsetSize,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  const scanUnit = (
    unitIndices: readonly number[],
  ): TechniqueApplyResult | null => {
    const empties: number[] = [];
    for (const i of unitIndices) {
      if (values[i] !== 0) continue;
      const m = getMask(i);
      if (m === 0) continue;
      empties.push(i);
    }
    if (empties.length < subsetSize) return null;

    let found: TechniqueApplyResult | null = null;
    forEachCombination(empties, subsetSize, (comb) => {
      if (found !== null) return;

      let union = 0;
      for (const i of comb) union |= getMask(i);
      if (popcount9(union) !== subsetSize) return;
      for (const i of comb) {
        if ((getMask(i) & ~union) !== 0) return;
      }
      const combSet = new Set(comb);
      const elimBitsByCell = new Array<number>(81).fill(0);
      for (const i of unitIndices) {
        if (values[i] !== 0) continue;
        if (combSet.has(i)) continue;
        const m = getMask(i);
        const overlap = m & union;
        if (overlap !== 0) elimBitsByCell[i] |= overlap;
      }

      const nextMasks = Array.from({ length: 81 }, (_, i) => {
        if (values[i] !== 0) return 0;
        return getMask(i) & ~elimBitsByCell[i]!;
      });

      const changedCells: number[] = [];
      for (let i = 0; i < 81; i++) {
        if (values[i] !== 0) continue;
        const prev = grid.cellAt(i).memoMask & 0x1ff;
        if (nextMasks[i]! !== prev) changedCells.push(i);
      }

      if (changedCells.length > 0) {
        found = {
          cellIndex: changedCells,
          grid: SudokuGrid.fromValuesAndCandidateMasks(values, nextMasks),
        };
      }
    });
    return found;
  };

  for (let r = 0; r < 9; r++) {
    const hit = scanUnit(sudokuRowCellIndices(r));
    if (hit) return hit;
  }
  for (let c = 0; c < 9; c++) {
    const hit = scanUnit(sudokuColCellIndices(c));
    if (hit) return hit;
  }
  for (let b = 0; b < 9; b++) {
    const hit = scanUnit(sudokuBlockCellIndices(b));
    if (hit) return hit;
  }

  return null;
}

function trySubsetStep(
  grid: SudokuGrid,
  subsetSize: SubsetSize,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  return trySubsetEliminationAfterPencil(grid, subsetSize);
}

/** ペア（ユニット内 2 マス・2 種類の候補にロック → 他マスからその 2 数字を削除）。 */
export function tryPairStep(grid: SudokuGrid): TechniqueApplyResult | null {
  return trySubsetStep(grid, 2);
}

/** トリプル（3 マス・3 種類）。 */
export function tryTripleStep(grid: SudokuGrid): TechniqueApplyResult | null {
  return trySubsetStep(grid, 3);
}

/** クァッド（4 マス・4 種類）。 */
export function tryQuadStep(grid: SudokuGrid): TechniqueApplyResult | null {
  return trySubsetStep(grid, 4);
}
