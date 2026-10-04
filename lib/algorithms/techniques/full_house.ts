import { ALL_CANDIDATE_BITS } from "@/lib/algorithms/techniques/helper";

import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { blockLabel, cellLabel, colLabel, rowLabel } from "@/lib/utils/grid";

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
  solution81?: string,
): TechniqueApplyResult | null {
  // 1周だけ走査し、元の盤だけを見て手を収集してから最後に一括適用する。
  const values = [...grid.values()];
  const opsByCell = new Map<number, number>();
  const unitByCell = new Map<number, { label: string; cells: readonly number[] }>();
  const collect = (label: string, cells: readonly number[]) => {
    const op = tryUnit(values, cells);
    if (!op) return;
    const existing = opsByCell.get(op.cellIndex);
    if (existing !== undefined) return;
    opsByCell.set(op.cellIndex, op.digit);
    unitByCell.set(op.cellIndex, { label, cells });
  };
  for (let r = 0; r < 9; r++) collect(rowLabel(r), sudokuRowCellIndices(r));
  for (let c = 0; c < 9; c++) collect(colLabel(c), sudokuColCellIndices(c));
  for (let b = 0; b < 9; b++) collect(blockLabel(b), sudokuBlockCellIndices(b));
  if (opsByCell.size === 0) return null;

  let nextGrid = grid;
  const changedCells: number[] = [];
  for (const [cellIndex, digit] of opsByCell) {
    const before = nextGrid;
    nextGrid = nextGrid.placeDigit(cellIndex, digit, solution81).next;
    if (nextGrid !== before) {
      changedCells.push(cellIndex);
    }
  }

  if (changedCells.length === 0) return null;
  const first = changedCells[0]!;
  const unit = unitByCell.get(first)!;
  const others = changedCells.length - 1;
  return {
    cellIndex: changedCells,
    grid: nextGrid,
    explanation: {
      basisCellIndex: unit.cells.filter((i) => i !== first),
      reason:
        `${unit.label}の空きマスは${cellLabel(first)}だけなので、残った ${opsByCell.get(first)} が入ります。` +
        (others > 0 ? `ほか ${others} マスも同じ理由で決まります。` : ""),
    },
  };
}
