export const ALL_CANDIDATE_BITS = 0x1ff;

/** 9ビット候補マスクの popcount */
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
