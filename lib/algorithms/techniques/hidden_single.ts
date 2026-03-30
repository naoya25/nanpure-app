import {
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";

import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

function tryUnit(
  values: readonly number[],
  candidateMaskGetter: (cellIndex: number) => number,
  indices: readonly number[],
): { cellIndex: number; digit: number } | null {
  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);
    let hit: number | null = null;
    for (const i of indices) {
      if (values[i] !== 0) continue;
      if (candidateMaskGetter(i) & bit) {
        if (hit !== null) {
          hit = -1;
          break;
        }
        hit = i;
      }
    }
    if (hit !== null && hit >= 0) {
      return { cellIndex: hit, digit };
    }
  }
  return null;
}

/** 隠れシングル。ユニット内で某数字の候補が 1 マスだけならその確定（先頭のパターン 1 のみ） */
export function tryHiddenSingleStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  // 見つかった hidden single を 1 回だけで終わらせず、
  // 候補更新によって新たに hidden single が生まれなくなるまで適用してから返す。
  let nextGrid = grid;
  const values = [...grid.values()];
  const changedCells: number[] = [];

  while (true) {
    let didChange = false;

    // `nextGrid` を都度参照するので、割り当てによる memoMask 更新が反映される。
    const getMask = (cellIndex: number) => nextGrid.cellAt(cellIndex).memoMask;

    for (let r = 0; r < 9; r++) {
      const hit = tryUnit(values, getMask, sudokuRowCellIndices(r));
      if (!hit) continue;

      const before = nextGrid;
      nextGrid = nextGrid.assignDeducedDigit(hit.cellIndex, hit.digit);
      if (nextGrid !== before) {
        values[hit.cellIndex] = hit.digit;
        changedCells.push(hit.cellIndex);
        didChange = true;
      }
    }

    for (let c = 0; c < 9; c++) {
      const hit = tryUnit(values, getMask, sudokuColCellIndices(c));
      if (!hit) continue;

      const before = nextGrid;
      nextGrid = nextGrid.assignDeducedDigit(hit.cellIndex, hit.digit);
      if (nextGrid !== before) {
        values[hit.cellIndex] = hit.digit;
        changedCells.push(hit.cellIndex);
        didChange = true;
      }
    }

    for (let b = 0; b < 9; b++) {
      const hit = tryUnit(values, getMask, sudokuBlockCellIndices(b));
      if (!hit) continue;

      const before = nextGrid;
      nextGrid = nextGrid.assignDeducedDigit(hit.cellIndex, hit.digit);
      if (nextGrid !== before) {
        values[hit.cellIndex] = hit.digit;
        changedCells.push(hit.cellIndex);
        didChange = true;
      }
    }

    if (!didChange) break;
  }

  if (changedCells.length === 0) return null;
  return { cellIndex: changedCells, grid: nextGrid };
}
