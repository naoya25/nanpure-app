import { describe, expect, it } from "vitest";

import { runTechniqueAutoUntilNoChange } from "@/lib/models/sudoku_technique_runner";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";
import { parsePuzzle81 } from "@/lib/validates/grid";

import { SOLVER_CASES } from "@/tests/fixtures/solver";

const manyEmptyCase = SOLVER_CASES[1]!;
const allTechniqueIds = Object.values(TechniqueId);

function initialGrid(): SudokuGrid {
  const { values } = parsePuzzle81(manyEmptyCase.puzzle81);
  return SudokuGrid.fromValues(values);
}

describe("runTechniqueAutoUntilNoChange maxSteps", () => {
  it("maxSteps: 1 のとき steps は 1 件以下で止まる", () => {
    const result = runTechniqueAutoUntilNoChange(
      initialGrid(),
      allTechniqueIds,
      manyEmptyCase.solution81,
      { maxSteps: 1 },
    );

    expect(result.steps.length).toBeLessThanOrEqual(1);
    expect(result.finishedBecauseNoChange).toBe(false);
  });

  it("未指定と maxSteps: 1 の 1 手目が同じ", () => {
    const unrestricted = runTechniqueAutoUntilNoChange(
      initialGrid(),
      allTechniqueIds,
      manyEmptyCase.solution81,
    );
    const limited = runTechniqueAutoUntilNoChange(
      initialGrid(),
      allTechniqueIds,
      manyEmptyCase.solution81,
      { maxSteps: 1 },
    );

    expect(unrestricted.steps.length).toBeGreaterThan(1);
    expect(limited.steps.length).toBe(1);
    expect(limited.steps[0]!.techniqueId).toBe(unrestricted.steps[0]!.techniqueId);
    expect(limited.steps[0]!.cellIndex).toEqual(unrestricted.steps[0]!.cellIndex);
    expect(limited.steps[0]!.grid.values()).toEqual(
      unrestricted.steps[0]!.grid.values(),
    );
  });
});
