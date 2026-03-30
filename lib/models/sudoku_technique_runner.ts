import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import {
  TechniqueAutoRunResult,
  TechniqueApplyResult,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";

import { tryFullHouseStep } from "@/lib/algorithms/techniques/full_house";
import { tryHiddenSingleStep } from "@/lib/algorithms/techniques/hidden_single";
import { tryMemoSingleStep } from "@/lib/algorithms/techniques/memo_single";
import { tryPencilMarkStep } from "@/lib/algorithms/techniques/pencil_mark";
import { tryPointingStep } from "@/lib/algorithms/techniques/pointing";
import { tryBoxLineReductionStep } from "@/lib/algorithms/techniques/box_line_reduction";
import { trySolutionSyncStep } from "@/lib/algorithms/techniques/solution_sync";
import { trySingleStep } from "@/lib/algorithms/techniques/single";

type TryTechnique = (
  grid: SudokuGrid,
  solution81?: string,
) => TechniqueApplyResult | null;

const TRY_BY_ID: Record<TechniqueId, TryTechnique> = {
  [TechniqueId.FULL_HOUSE]: tryFullHouseStep,
  [TechniqueId.SINGLE]: trySingleStep,
  [TechniqueId.HIDDEN_SINGLE]: tryHiddenSingleStep,
  [TechniqueId.SOLUTION_SYNC]: trySolutionSyncStep,
  [TechniqueId.PENCIL_MARK]: (grid) => tryPencilMarkStep(grid),
  [TechniqueId.MEMO_SINGLE]: tryMemoSingleStep,
  [TechniqueId.POINTING]: (grid) => tryPointingStep(grid),
  [TechniqueId.BOX_LINE_REDUCTION]: (grid) => tryBoxLineReductionStep(grid),
};

export function runTechniqueStep(
  grid: SudokuGrid,
  techniqueId: TechniqueId,
  solution81?: string,
): TechniqueApplyResult | null {
  return TRY_BY_ID[techniqueId](grid, solution81);
}

function sortByTechniqueOrder(
  selectedTechniqueIds: readonly TechniqueId[],
): TechniqueId[] {
  const selected = new Set(selectedTechniqueIds);
  return Object.values(TechniqueId).filter((id) => selected.has(id));
}

/**
 * 選択したテクニックだけを難易度順（易→難）で繰り返し適用する。
 * あるテクニックで 1 手入ったら **先頭のテクニックに戻る**。
 * 先頭から順にすべて「適用なし」となった 1 周が終わったら終了と判定する。
 */
export function runTechniqueAutoUntilNoChange(
  grid: SudokuGrid,
  selectedTechniqueIds: readonly TechniqueId[],
  solution81?: string,
): TechniqueAutoRunResult {
  const ordered = sortByTechniqueOrder(selectedTechniqueIds);
  if (ordered.length === 0) {
    return { grid, steps: [], finishedBecauseNoChange: true };
  }

  let nextGrid = grid;
  const steps: TechniqueAutoRunResult["steps"] = [];

  // 反復上限は安全弁。通常は「易→難を一周して適用なし」で終了する。
  const maxTryOneTechnique = 81 * 9 * ordered.length;
  let i = 0;
  for (let guard = 0; guard < maxTryOneTechnique; guard++) {
    if (i >= ordered.length) {
      return { grid: nextGrid, steps, finishedBecauseNoChange: true };
    }

    const techniqueId = ordered[i];
    const result = runTechniqueStep(nextGrid, techniqueId, solution81);
    if (result) {
      nextGrid = result.grid;
      steps.push({
        techniqueId,
        cellIndex: result.cellIndex,
        grid: result.grid,
      });
      i = 0;
    } else {
      i += 1;
    }
  }

  return { grid: nextGrid, steps, finishedBecauseNoChange: false };
}
