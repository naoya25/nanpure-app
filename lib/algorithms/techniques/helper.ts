import { SUDOKU_CELLS, sudokuPeerIndices } from "@/lib/validates/grid";

export const ALL_CANDIDATE_BITS = 0x1ff;

/**
 * 確定数字だけから、マス `index` の候補ビット（空マス以外は 0）。
 * ピアに現れる 1〜9 は候補から除く。
 */
export function computeCandidateMaskForCell(
  values: readonly number[],
  index: number,
): number {
  if (values[index] !== 0 && values[index] !== undefined) return 0;
  let mask = ALL_CANDIDATE_BITS;
  for (const p of sudokuPeerIndices(index)) {
    if (p === index) continue;
    const v = values[p] ?? 0;
    if (v >= 1 && v <= 9) {
      mask &= ALL_CANDIDATE_BITS & ~(1 << (v - 1));
    }
  }
  return mask;
}

/** 9ビット候補マスクの popcount */
export function popcount9(mask: number): number {
  let n = 0;
  for (let m = mask & 0x1ff; m !== 0; m &= m - 1) {
    n += 1;
  }
  return n;
}

/** 全マスのルールベース候補。確定マスは 0。 */
export function computeCandidateMasks(values: readonly number[]): Uint16Array {
  const out = new Uint16Array(SUDOKU_CELLS);
  for (let i = 0; i < SUDOKU_CELLS; i++) {
    out[i] = values[i] ? 0 : computeCandidateMaskForCell(values, i);
  }
  return out;
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
