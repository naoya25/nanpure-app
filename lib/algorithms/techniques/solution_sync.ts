import { SUDOKU_CELLS } from "@/lib/validates/grid";

import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/**
 * 解答文字列との整合（プレイ支援用の 1 手）。
 *
 * 確定マスが `solution81` と食い違っていれば、その数字だけ消す（`clearValueKeepMemo`）。
 * メモは変更しない。
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

    const c = next.cellAt(i);

    if (c.value !== 0 && c.value !== solDigit) {
      next = next.clearValueKeepMemo(i);
      changed.add(i);
    }
  }

  if (changed.size === 0) return null;
  return { cellIndex: [...changed], grid: next };
}
