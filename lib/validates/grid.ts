export const SUDOKU_CELLS = 81;

export type ParsedPuzzle = {
  /** 各マス 0〜9（0 は空） */
  values: number[];
  /** 問題で与えられたマス（ユーザーは変更不可） */
  fixed: boolean[];
};

/**
 * `puzzle_81` を盤面用にパースする。長さ・文字が不正なら例外。
 */
export function parsePuzzle81(puzzle81: string): ParsedPuzzle {
  if (puzzle81.length !== SUDOKU_CELLS) {
    throw new Error(`puzzle_81 must be ${SUDOKU_CELLS} chars, got ${puzzle81.length}`);
  }
  const values = [...puzzle81].map((ch) => {
    const n = parseInt(ch, 10);
    if (!Number.isFinite(n) || n < 0 || n > 9) {
      throw new Error(`invalid puzzle character: ${ch}`);
    }
    return n;
  });
  const fixed = values.map((v) => v !== 0);
  return { values, fixed };
}
