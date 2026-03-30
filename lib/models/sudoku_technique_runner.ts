import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import {
  TechniqueAutoRunResult,
  TechniqueApplyResult,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";

import { tryFullHouseStep } from "@/lib/algorithms/techniques/full_house";
import { tryHiddenSingleStep } from "@/lib/algorithms/techniques/hidden_single";
import { trySingleStep } from "@/lib/algorithms/techniques/single";
import { tryPencilMarkStep } from "@/lib/algorithms/techniques/pencil_mark";

type TryTechnique = (grid: SudokuGrid) => TechniqueApplyResult | null;

const TRY_BY_ID: Record<TechniqueId, TryTechnique> = {
  [TechniqueId.FULL_HOUSE]: tryFullHouseStep,
  [TechniqueId.SINGLE]: trySingleStep,
  [TechniqueId.HIDDEN_SINGLE]: tryHiddenSingleStep,
  [TechniqueId.PENCIL_MARK]: tryPencilMarkStep,
};

export function runTechniqueStep(
  grid: SudokuGrid,
  techniqueId: TechniqueId,
): TechniqueApplyResult | null {
  return TRY_BY_ID[techniqueId](grid);
}

function sortByTechniqueOrder(
  selectedTechniqueIds: readonly TechniqueId[],
): TechniqueId[] {
  const selected = new Set(selectedTechniqueIds);
  return Object.values(TechniqueId).filter((id) => selected.has(id));
}

/**
 * 選択したテクニックだけを難易度順（易→難）で繰り返し適用し、
 * 1 周しても変化がなければ終了と判定する。
 */
export function runTechniqueAutoUntilNoChange(
  grid: SudokuGrid,
  selectedTechniqueIds: readonly TechniqueId[],
): TechniqueAutoRunResult {
  const ordered = sortByTechniqueOrder(selectedTechniqueIds);
  if (ordered.length === 0) {
    return { grid, steps: [], finishedBecauseNoChange: true };
  }

  let nextGrid = grid;
  const steps: TechniqueAutoRunResult["steps"] = [];

  // 反復上限は安全弁。通常は「1周で変化なし」で終了する。
  const maxRounds = 81 * 9;
  for (let round = 0; round < maxRounds; round++) {
    let changedInRound = false;

    for (const techniqueId of ordered) {
      const result = runTechniqueStep(nextGrid, techniqueId);
      if (!result) continue;
      changedInRound = true;
      nextGrid = result.grid;
      steps.push({
        techniqueId,
        cellIndex: result.cellIndex,
        grid: result.grid,
      });
    }

    if (!changedInRound) {
      return { grid: nextGrid, steps, finishedBecauseNoChange: true };
    }
  }

  return { grid: nextGrid, steps, finishedBecauseNoChange: false };
}
