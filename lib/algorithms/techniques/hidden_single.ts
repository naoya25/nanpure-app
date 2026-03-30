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
  const values = grid.values();
  const getMask = (cellIndex: number) => grid.cellAt(cellIndex).memoMask;
  for (let r = 0; r < 9; r++) {
    const hit = tryUnit(values, getMask, sudokuRowCellIndices(r));
    if (hit) {
      const next = grid.assignDeducedDigit(hit.cellIndex, hit.digit);
      if (next === grid) return null;
      return { cellIndex: [hit.cellIndex], grid: next };
    }
  }
  for (let c = 0; c < 9; c++) {
    const hit = tryUnit(values, getMask, sudokuColCellIndices(c));
    if (hit) {
      const next = grid.assignDeducedDigit(hit.cellIndex, hit.digit);
      if (next === grid) return null;
      return { cellIndex: [hit.cellIndex], grid: next };
    }
  }
  for (let b = 0; b < 9; b++) {
    const hit = tryUnit(values, getMask, sudokuBlockCellIndices(b));
    if (hit) {
      const next = grid.assignDeducedDigit(hit.cellIndex, hit.digit);
      if (next === grid) return null;
      return { cellIndex: [hit.cellIndex], grid: next };
    }
  }
  return null;
}
