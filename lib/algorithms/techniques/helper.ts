import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { SUDOKU_CELLS, sudokuPeerIndices } from "@/lib/validates/grid";

export const ALL_CANDIDATE_BITS = 0x1ff;

/**
 * 空マスでメモが未入力（`memoMask === 0`）のセルが 1 つでもある。
 * ペンシルマークを自動記入せず、候補交差前提のテクニックは実行しない。
 */
export function hasEmptyCellWithoutMemo(grid: SudokuGrid): boolean {
  for (let i = 0; i < SUDOKU_CELLS; i++) {
    const c = grid.cellAt(i);
    if (c.value === 0 && (c.memoMask & 0x1ff) === 0) return true;
  }
  return false;
}

/** 9ビット候補マスクの 空マスの数 */
export function popcount9(mask: number): number {
  let n = 0;
  for (let m = mask & 0x1ff; m !== 0; m &= m - 1) {
    n += 1;
  }
  return n;
}

export function sudokuRowCellIndices(row: number): readonly number[] {
  if (row < 0 || row > 8) {
    throw new RangeError(`row out of range: ${row}`);
  }
  return Array.from({ length: 9 }, (_, c) => row * 9 + c);
}

export function sudokuColCellIndices(col: number): readonly number[] {
  if (col < 0 || col > 8) {
    throw new RangeError(`col out of range: ${col}`);
  }
  return Array.from({ length: 9 }, (_, r) => r * 9 + col);
}

/** `block` は 0〜8（左→右・上→下の 3×3 ブロック番号） */
export function sudokuBlockCellIndices(block: number): readonly number[] {
  if (block < 0 || block > 8) {
    throw new RangeError(`block out of range: ${block}`);
  }
  const br = Math.floor(block / 3) * 3;
  const bc = (block % 3) * 3;
  const out: number[] = [];
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      out.push((br + dr) * 9 + (bc + dc));
    }
  }
  return out;
}

/**
 * 空マスの有効候補を返す getter を作る。
 * - ピア確定値で除外
 * - メモがある場合はメモと交差
 */
export function makeGetMask(values: readonly number[], grid: SudokuGrid) {
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

export type GetMask = (cellIndex: number) => number;

/**
 * 削除ビット配列を現在候補へ適用し、差分がある場合だけ TechniqueApplyResult を返す。
 */
export function buildTechniqueResultFromElimBits(
  grid: SudokuGrid,
  values: readonly number[],
  getMask: GetMask,
  elimBitsByCell: readonly number[],
): TechniqueApplyResult | null {
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
 * 2 端点を同時に見るマスから bit を削除する共通処理。
 * `skipCells` はパターン構成セル（削除対象外）を渡す。
 */
export function applyEliminationSeeingBothEnds(
  grid: SudokuGrid,
  values: readonly number[],
  getMask: GetMask,
  end1: number,
  end2: number,
  bit: number,
  skipCells: readonly number[],
): TechniqueApplyResult | null {
  const peers1 = new Set(sudokuPeerIndices(end1));
  const peers2 = new Set(sudokuPeerIndices(end2));
  const skip = new Set<number>(skipCells);

  const elimBitsByCell = new Array<number>(81).fill(0);
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    if (skip.has(i)) continue;
    if (!peers1.has(i) || !peers2.has(i)) continue;
    if (getMask(i) & bit) elimBitsByCell[i] |= bit;
  }

  return buildTechniqueResultFromElimBits(grid, values, getMask, elimBitsByCell);
}
