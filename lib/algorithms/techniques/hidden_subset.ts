import {
  ALL_CANDIDATE_BITS,
  hasEmptyCellWithoutMemo,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { sudokuPeerIndices } from "@/lib/validates/grid";

/**
 * 隠れペア(2) / 隠れトリプル(3) / 隠れクァッド(4)。某 n 桁の候補がユニット内のちょうど n マスにだけ現れる → それらのマスから n 桁以外の候補を削除。
 * 空マスでメモ未入力が 1 つでもあれば実行しない。
 *
 * 1 回の適用では行→列→ブロックの順で、最初に候補削除が起きるパターンだけを行う。
 */
type HiddenSubsetSize = 2 | 3 | 4;

const DIGITS_POOL: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function makeGetMask(values: readonly number[], grid: SudokuGrid) {
  return (cellIndex: number): number => {
    if (values[cellIndex] !== 0) return 0;

    let usedMask = 0;
    for (const j of sudokuPeerIndices(cellIndex)) {
      if (j === cellIndex) continue;
      const v = values[j] ?? 0;
      if (v === 0) continue;
      usedMask |= 1 << (v - 1);
    }

    let candidateMask = ALL_CANDIDATE_BITS & ~usedMask;
    const memoMask = grid.cellAt(cellIndex).memoMask;
    if (memoMask !== 0) candidateMask &= memoMask;
    return candidateMask;
  };
}

function forEachCombination(
  pool: readonly number[],
  n: number,
  visit: (comb: readonly number[]) => void,
): void {
  const k = pool.length;
  if (n > k) return;
  const pick: number[] = [];
  const rec = (start: number, depth: number) => {
    if (depth === n) {
      visit(pick.slice());
      return;
    }
    for (let i = start; i <= k - (n - depth); i++) {
      pick.push(pool[i]!);
      rec(i + 1, depth + 1);
      pick.pop();
    }
  };
  rec(0, 0);
}

function tryHiddenSubsetEliminationAfterPencil(
  grid: SudokuGrid,
  subsetSize: HiddenSubsetSize,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  const scanUnit = (
    unitIndices: readonly number[],
  ): TechniqueApplyResult | null => {
    let found: TechniqueApplyResult | null = null;
    forEachCombination(DIGITS_POOL, subsetSize, (digitComb) => {
      if (found !== null) return;

      let maskDigits = 0;
      for (const d of digitComb) maskDigits |= 1 << (d - 1);

      const cellsWithAny: number[] = [];
      for (const i of unitIndices) {
        if (values[i] !== 0) continue;
        const m = getMask(i);
        if (m === 0) continue;
        if ((m & maskDigits) !== 0) cellsWithAny.push(i);
      }
      if (cellsWithAny.length !== subsetSize) return;

      let cover = 0;
      for (const i of cellsWithAny) cover |= getMask(i);
      if ((cover & maskDigits) !== maskDigits) return;

      const elimBitsByCell = new Array<number>(81).fill(0);
      for (const i of cellsWithAny) {
        elimBitsByCell[i] |= getMask(i) & ~maskDigits;
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

function tryHiddenSubsetStep(
  grid: SudokuGrid,
  subsetSize: HiddenSubsetSize,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  return tryHiddenSubsetEliminationAfterPencil(grid, subsetSize);
}

/** 隠れペア。 */
export function tryHiddenPairStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  return tryHiddenSubsetStep(grid, 2);
}

/** 隠れトリプル。 */
export function tryHiddenTripleStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  return tryHiddenSubsetStep(grid, 3);
}

/** 隠れクァッド。 */
export function tryHiddenQuadStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  return tryHiddenSubsetStep(grid, 4);
}
