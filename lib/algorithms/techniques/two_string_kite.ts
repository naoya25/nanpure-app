import {
  hasEmptyCellWithoutMemo,
  makeGetMask,
} from "@/lib/algorithms/techniques/helper";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { sudokuPeerIndices } from "@/lib/validates/grid";

function sameBlock(a: number, b: number): boolean {
  const ar = Math.floor(a / 9);
  const ac = a % 9;
  const br = Math.floor(b / 9);
  const bc = b % 9;
  return Math.floor(ar / 3) === Math.floor(br / 3) && Math.floor(ac / 3) === Math.floor(bc / 3);
}

function applyEliminationSeeingBothEnds(
  grid: SudokuGrid,
  values: readonly number[],
  getMask: (i: number) => number,
  end1: number,
  end2: number,
  bit: number,
  connectors: readonly number[],
): TechniqueApplyResult | null {
  const peers1 = new Set(sudokuPeerIndices(end1));
  const peers2 = new Set(sudokuPeerIndices(end2));
  const skip = new Set<number>([end1, end2, ...connectors]);

  const elimBitsByCell = new Array<number>(81).fill(0);
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    if (skip.has(i)) continue;
    if (!peers1.has(i) || !peers2.has(i)) continue;
    if (getMask(i) & bit) elimBitsByCell[i] |= bit;
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
  if (changedCells.length === 0) return null;

  return {
    cellIndex: changedCells,
    grid: SudokuGrid.fromValuesAndCandidateMasks(values, nextMasks),
  };
}

/**
 * ツーストリング・カイト（単一数字）。
 * ある行の共役ペア（2 候補）とある列の共役ペア（2 候補）を取り、
 * それぞれ片側の候補が同一ブロック内で繋がるとき、残りの 2 端点を同時に見るマスから候補を削除する。
 */
export function tryTwoStringKiteStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);

    const rowPairs: Array<readonly [number, number] | null> = new Array(9).fill(null);
    for (let r = 0; r < 9; r++) {
      const cols: number[] = [];
      for (let c = 0; c < 9; c++) {
        if (getMask(r * 9 + c) & bit) cols.push(c);
      }
      if (cols.length === 2) rowPairs[r] = [cols[0]!, cols[1]!];
    }

    const colPairs: Array<readonly [number, number] | null> = new Array(9).fill(null);
    for (let c = 0; c < 9; c++) {
      const rows: number[] = [];
      for (let r = 0; r < 9; r++) {
        if (getMask(r * 9 + c) & bit) rows.push(r);
      }
      if (rows.length === 2) colPairs[c] = [rows[0]!, rows[1]!];
    }

    for (let r = 0; r < 9; r++) {
      const rowPair = rowPairs[r];
      if (!rowPair) continue;

      for (let c = 0; c < 9; c++) {
        const colPair = colPairs[c];
        if (!colPair) continue;

        const rowCellA = r * 9 + rowPair[0];
        const rowCellB = r * 9 + rowPair[1];
        const colCellA = colPair[0] * 9 + c;
        const colCellB = colPair[1] * 9 + c;

        const patterns: Array<
          readonly [number, number, number, number]
        > = [
          [rowCellA, colCellA, rowCellB, colCellB],
          [rowCellA, colCellB, rowCellB, colCellA],
          [rowCellB, colCellA, rowCellA, colCellB],
          [rowCellB, colCellB, rowCellA, colCellA],
        ];
        for (const [connector1, connector2, end1, end2] of patterns) {
          if (connector1 === connector2) continue;
          if (!sameBlock(connector1, connector2)) continue;
          if (end1 === end2) continue;
          const hit = applyEliminationSeeingBothEnds(
            grid,
            values,
            getMask,
            end1,
            end2,
            bit,
            [connector1, connector2],
          );
          if (hit) return hit;
        }
      }
    }
  }

  return null;
}
