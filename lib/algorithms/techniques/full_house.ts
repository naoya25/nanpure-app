import { ALL_CANDIDATE_BITS } from "@/lib/algorithms/techniques/helper";

import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

import {
  popcount9,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";

function tryUnit(
  values: readonly number[],
  indices: readonly number[],
): { cellIndex: number; digit: number } | null {
  let empty: number | null = null;
  let used = 0;
  for (const i of indices) {
    const v = values[i] ?? 0;
    if (v === 0) {
      if (empty !== null) return null;
      empty = i;
    } else if (v >= 1 && v <= 9) {
      used |= 1 << (v - 1);
    }
  }
  if (empty === null) return null;
  const missingBits = ALL_CANDIDATE_BITS & ~used;
  if (popcount9(missingBits) !== 1) return null;
  let digit = 0;
  for (let d = 1; d <= 9; d++) {
    if (missingBits & (1 << (d - 1))) {
      digit = d;
      break;
    }
  }
  return { cellIndex: empty, digit };
}

/** フルハウス（ラストセル）が 1 つあればその 1 手。なければ null */
export function tryFullHouseStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  // 1周だけ走査し、その周回で見つかった手をすべて適用して返す。
  const values = [...grid.values()];
  let nextGrid = grid;
  const changedCells: number[] = [];
  for (let r = 0; r < 9; r++) {
    const op = tryUnit(values, sudokuRowCellIndices(r));
    if (!op) continue;
    const before = nextGrid;
    nextGrid = nextGrid.placeDigit(op.cellIndex, op.digit).next;
    if (nextGrid !== before) {
      values[op.cellIndex] = op.digit;
      changedCells.push(op.cellIndex);
    }
  }
  for (let c = 0; c < 9; c++) {
    const op = tryUnit(values, sudokuColCellIndices(c));
    if (!op) continue;
    const before = nextGrid;
    nextGrid = nextGrid.placeDigit(op.cellIndex, op.digit).next;
    if (nextGrid !== before) {
      values[op.cellIndex] = op.digit;
      changedCells.push(op.cellIndex);
    }
  }
  for (let b = 0; b < 9; b++) {
    const op = tryUnit(values, sudokuBlockCellIndices(b));
    if (!op) continue;
    const before = nextGrid;
    nextGrid = nextGrid.placeDigit(op.cellIndex, op.digit).next;
    if (nextGrid !== before) {
      values[op.cellIndex] = op.digit;
      changedCells.push(op.cellIndex);
    }
  }
  if (changedCells.length === 0) return null;
  return { cellIndex: changedCells, grid: nextGrid };
}
