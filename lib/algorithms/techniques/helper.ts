import type { SudokuGrid } from "@/lib/models/sudoku_grid";
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
