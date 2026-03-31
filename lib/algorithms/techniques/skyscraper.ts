import {
  hasEmptyCellWithoutMemo,
  makeGetMask,
  popcount9,
} from "@/lib/algorithms/techniques/helper";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { sudokuPeerIndices } from "@/lib/validates/grid";

/** 9 ビットのマスクでちょうど 1 ビットが立っているとき、そのインデックス 0..8 */
function soleBitIndex(mask: number): number {
  const m = mask & 0x1ff;
  if (popcount9(m) !== 1) return -1;
  for (let i = 0; i < 9; i++) {
    if (m & (1 << i)) return i;
  }
  return -1;
}

function applyEliminationSeeingBothRoofs(
  grid: SudokuGrid,
  values: readonly number[],
  getMask: (i: number) => number,
  roof1: number,
  roof2: number,
  bit: number,
  /** パターン上のフロア（共有列／共有行の共役側）。両屋根を見るが削除してはいけないマス */
  floorCells: readonly [number, number],
): TechniqueApplyResult | null {
  const peers1 = new Set(sudokuPeerIndices(roof1));
  const peers2 = new Set(sudokuPeerIndices(roof2));
  const skip = new Set<number>([roof1, roof2, floorCells[0], floorCells[1]]);

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
 * スカイスクレーパー（単一数字）。2 行（または 2 列）にそれぞれ共役ペアがあり、
 * 列（行）マスクの交差がちょうど 1 — 共有「足」の列（行）＋屋根 2 マス。
 * 両屋根を同時に見るマスから当該数字の候補を削除する。
 *
 * 空マスでメモ未入力が 1 つでもあれば実行しない。
 * 数字 → 行の組 → 列の組の順で最初の削除のみ（他テクニックと同方針）。
 */
export function trySkyscraperStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  const rowDigitColMask = (row: number, bit: number): number => {
    let m = 0;
    for (let c = 0; c < 9; c++) {
      if (getMask(row * 9 + c) & bit) m |= 1 << c;
    }
    return m;
  };

  const colDigitRowMask = (col: number, bit: number): number => {
    let m = 0;
    for (let r = 0; r < 9; r++) {
      if (getMask(r * 9 + col) & bit) m |= 1 << r;
    }
    return m;
  };

  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);

    for (let r1 = 0; r1 < 9; r1++) {
      const m1 = rowDigitColMask(r1, bit);
      if (popcount9(m1) !== 2) continue;

      for (let r2 = r1 + 1; r2 < 9; r2++) {
        const m2 = rowDigitColMask(r2, bit);
        if (popcount9(m2) !== 2) continue;

        const shared = m1 & m2;
        if (popcount9(shared) !== 1) continue;

        const cRoof1 = soleBitIndex(m1 & ~shared);
        const cRoof2 = soleBitIndex(m2 & ~shared);
        if (cRoof1 < 0 || cRoof2 < 0 || cRoof1 === cRoof2) continue;

        const sharedCol = soleBitIndex(shared);
        if (sharedCol < 0) continue;

        const roof1 = r1 * 9 + cRoof1;
        const roof2 = r2 * 9 + cRoof2;
        const floorCells: [number, number] = [
          r1 * 9 + sharedCol,
          r2 * 9 + sharedCol,
        ];
        const hit = applyEliminationSeeingBothRoofs(
          grid,
          values,
          getMask,
          roof1,
          roof2,
          bit,
          floorCells,
        );
        if (hit) return hit;
      }
    }

    for (let col1 = 0; col1 < 9; col1++) {
      const m1 = colDigitRowMask(col1, bit);
      if (popcount9(m1) !== 2) continue;

      for (let col2 = col1 + 1; col2 < 9; col2++) {
        const m2 = colDigitRowMask(col2, bit);
        if (popcount9(m2) !== 2) continue;

        const shared = m1 & m2;
        if (popcount9(shared) !== 1) continue;

        const rRoof1 = soleBitIndex(m1 & ~shared);
        const rRoof2 = soleBitIndex(m2 & ~shared);
        if (rRoof1 < 0 || rRoof2 < 0 || rRoof1 === rRoof2) continue;

        const sharedRow = soleBitIndex(shared);
        if (sharedRow < 0) continue;

        const roof1 = rRoof1 * 9 + col1;
        const roof2 = rRoof2 * 9 + col2;
        const floorCells: [number, number] = [
          sharedRow * 9 + col1,
          sharedRow * 9 + col2,
        ];
        const hit = applyEliminationSeeingBothRoofs(
          grid,
          values,
          getMask,
          roof1,
          roof2,
          bit,
          floorCells,
        );
        if (hit) return hit;
      }
    }
  }

  return null;
}
