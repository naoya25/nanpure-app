import { SUDOKU_CELLS } from "@/lib/validates/grid";

/** 入力した 1〜9 がそのマスの正解と一致するか */
export function isDigitCorrectForSolution(
  digit: number,
  solution81: string,
  index: number,
): boolean {
  if (digit < 1 || digit > 9) return false;
  return solution81[index] === String(digit);
}

/** 正解で `digit` が置かれるすべてのマスが、盤上でも `digit` で正しく埋まっているか */
export function isEverySolutionCellForDigitFilled(
  digit: number,
  values: readonly number[],
  solution81: string,
): boolean {
  if (digit < 1 || digit > 9) return false;
  if (solution81.length !== SUDOKU_CELLS || values.length !== SUDOKU_CELLS) {
    return false;
  }
  const ch = String(digit);
  for (let i = 0; i < SUDOKU_CELLS; i++) {
    if (solution81[i] !== ch) continue;
    if (values[i] !== digit) return false;
  }
  return true;
}

/** 全マスが 1〜9 で埋まっているか */
export function isBoardComplete(values: readonly number[]): boolean {
  return (
    values.length === SUDOKU_CELLS &&
    values.every((v) => v >= 1 && v <= 9)
  );
}

/** 全マスが正解文字列と一致するか（`isBoardComplete` 後に使う想定） */
export function isBoardMatchingSolution(
  values: readonly number[],
  solution81: string,
): boolean {
  if (solution81.length !== SUDOKU_CELLS || values.length !== SUDOKU_CELLS) {
    return false;
  }
  return values.every((v, i) => String(v) === solution81[i]);
}
