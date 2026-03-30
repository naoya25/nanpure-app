import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import {
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
