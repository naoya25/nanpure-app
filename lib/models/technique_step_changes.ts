import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueAutoRunStep } from "@/lib/types/sudoku_technique_types";
import { cellLabel, digitsLabel } from "@/lib/utils/grid";

/** テクニックの 1 手で盤がどう変わるかを、変更マスごとの文にする（ヒントの解説用） */
export function describeTechniqueStepChanges(
  before: SudokuGrid,
  step: Pick<TechniqueAutoRunStep, "cellIndex" | "grid">,
): string[] {
  const lines: string[] = [];
  let memoWrittenCells = 0;

  for (const i of step.cellIndex) {
    const prev = before.cellAt(i);
    const next = step.grid.cellAt(i);
    if (prev.value === 0 && next.value !== 0) {
      lines.push(`${cellLabel(i)}に ${next.value} が入る`);
      continue;
    }
    const removed = prev.memoMask & ~next.memoMask & 0x1ff;
    if (removed !== 0) {
      lines.push(`${cellLabel(i)}から候補 ${digitsLabel(removed)} を消す`);
    } else if (prev.memoMask === 0 && next.memoMask !== 0) {
      memoWrittenCells += 1;
    }
  }

  if (memoWrittenCells > 0) {
    lines.push(`空きマス ${memoWrittenCells} 個に候補を書き込む`);
  }
  return lines;
}
