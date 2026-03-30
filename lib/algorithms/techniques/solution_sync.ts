import { SUDOKU_CELLS } from "@/lib/validates/grid";

import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/**
 * 解答文字列との整合（プレイ支援用の 1 手）。
 *
 * - 確定マスが `solution81` と食い違っていれば消す（`clearValueKeepMemo` 相当）。
 * - 空マスでメモがあり、かつそのマスの正解数字がメモに含まれていなければビットを足す。
 *
 * `solution81` が無い・長さが不正なときは何もしない（`null`）。
 */
export function trySolutionSyncStep(
  grid: SudokuGrid,
  solution81?: string,
): TechniqueApplyResult | null {
  if (solution81 === undefined || solution81.length !== SUDOKU_CELLS) {
    return null;
  }

  const changed = new Set<number>();
  let next = grid;

  for (let i = 0; i < SUDOKU_CELLS; i++) {
    const ch = solution81[i] ?? "";
    const solDigit = Number(ch);
    if (solDigit < 1 || solDigit > 9) continue;

    let c = next.cellAt(i);

    if (c.value !== 0) {
      if (c.value !== solDigit) {
        next = next.clearValueKeepMemo(i);
        changed.add(i);
        c = next.cellAt(i);
      }
    }

    if (c.value === 0 && c.memoMask !== 0) {
      const bit = 1 << (solDigit - 1);
      if ((c.memoMask & bit) === 0) {
        next = next.addMemoDigit(i, solDigit);
        changed.add(i);
      }
    }
  }

  if (changed.size === 0) return null;
  return { cellIndex: [...changed], grid: next };
}
