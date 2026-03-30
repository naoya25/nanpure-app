import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import type {
  TechniqueApplyResult,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";

import { tryFullHouseStep } from "@/lib/algorithms/techniques/full_house";
import { tryHiddenSingleStep } from "@/lib/algorithms/techniques/hidden_single";
import { trySingleStep } from "@/lib/algorithms/techniques/single";

export type TechniqueDescriptor = {
  id: TechniqueId;
  label: string;
};

export const TECHNIQUE_BUTTONS = [
  { id: "fullHouse", label: "フルハウス" },
  { id: "single", label: "シングル" },
  { id: "hiddenSingle", label: "隠れシングル" },
] as const satisfies readonly TechniqueDescriptor[];

type TryTechnique = (
  grid: SudokuGrid,
) => TechniqueApplyResult | null;

const TRY_BY_ID: Record<TechniqueId, TryTechnique> = {
  fullHouse: tryFullHouseStep,
  single: trySingleStep,
  hiddenSingle: tryHiddenSingleStep,
};

export function runTechniqueStep(
  grid: SudokuGrid,
  techniqueId: TechniqueId,
): TechniqueApplyResult | null {
  return TRY_BY_ID[techniqueId](grid);
}
