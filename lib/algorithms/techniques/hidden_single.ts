import {
  ALL_CANDIDATE_BITS,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";

import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import { sudokuPeerIndices } from "@/lib/validates/grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { blockLabel, cellLabel, colLabel, rowLabel } from "@/lib/utils/grid";

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
  solution81?: string,
): TechniqueApplyResult | null {
  // 1周だけ走査し、元の盤だけを見て手を収集してから最後に一括適用する。
  const values = [...grid.values()];
  const opsByCell = new Map<number, number>();
  // 元の `grid` / `values` だけを参照し、memo がなくても盤面制約だけで候補を導出する。
  const getMask = (cellIndex: number) => {
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

  const unitByCell = new Map<number, { label: string; cells: readonly number[] }>();
  const collect = (label: string, cells: readonly number[]) => {
    const hit = tryUnit(values, getMask, cells);
    if (!hit) return;
    if (opsByCell.has(hit.cellIndex)) return;
    opsByCell.set(hit.cellIndex, hit.digit);
    unitByCell.set(hit.cellIndex, { label, cells });
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
        `${unit.label}で ${opsByCell.get(first)} を入れられるマスは${cellLabel(first)}だけです。` +
        (others > 0 ? `ほか ${others} マスも同じ理由で決まります。` : ""),
    },
  };
}
