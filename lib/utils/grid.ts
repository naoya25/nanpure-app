/**
 * 81 文字の盤面文字列を 9 行（各 9 文字）に分ける。
 * 長さが 81 でないときは検証せず、1 要素の配列でそのまま返す。
 */
export function linesOf81(s: string): string[] {
  if (s.length !== 81) {
    return [s];
  }
  return Array.from({ length: 9 }, (_, i) => s.slice(i * 9, i * 9 + 9));
}

/** 行の符号（上から A〜I）。盤の左に表示するものと同じ */
export const ROW_LETTERS = "ABCDEFGHI";

/** マス index `0..80` の表示名。行の符号 + 列番号（例: 2 行目・3 列目は `B3`） */
export function cellLabel(cellIndex: number): string {
  return `${ROW_LETTERS[Math.floor(cellIndex / 9)]}${(cellIndex % 9) + 1}`;
}

/** 複数マスの表示名を「・」でつなぐ */
export function cellsLabel(cellIndices: readonly number[]): string {
  return cellIndices.map(cellLabel).join("・");
}

/** 行 `0..8` の表示名（例: `C行`） */
export function rowLabel(row: number): string {
  return `${ROW_LETTERS[row]}行`;
}

/** 列 `0..8` の表示名（例: `5列`） */
export function colLabel(col: number): string {
  return `${col + 1}列`;
}

/** ブロック `0..8`（左→右・上→下）の表示名（例: `ブロック5`） */
export function blockLabel(block: number): string {
  return `ブロック${block + 1}`;
}

/** 全 27 ユニットの通し番号（行 0..8・列 9..17・ブロック 18..26）の表示名 */
export function unitLabel(unitIndex: number): string {
  if (unitIndex < 9) return rowLabel(unitIndex);
  if (unitIndex < 18) return colLabel(unitIndex - 9);
  return blockLabel(unitIndex - 18);
}

/** 9 ビットの候補マスクに含まれる数字（昇順） */
export function digitsOfMask(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (mask & (1 << (d - 1))) out.push(d);
  }
  return out;
}

/** 9 ビットの候補マスクの表示名（例: `3・5`） */
export function digitsLabel(mask: number): string {
  return digitsOfMask(mask).join("・");
}
