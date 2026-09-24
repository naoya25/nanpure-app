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

describe("runTechniqueAutoUntilNoChange TRIAL_AND_ERROR", () => {
  // 生成器（seed 20260923）の出力のうち、仮置き以外の全テクニックで詰まった問題
  const stuckPuzzle81 =
    "006100907000800060013070004050200001000085006007001000700000000060003018021600030";
  const stuckSolution81 =
    "846132957275849163913576284354267891192485376687391542738914625569723418421658739";

  function stuckInitialGrid(): SudokuGrid {
    return SudokuGrid.fromValues(parsePuzzle81(stuckPuzzle81).values);
  }

  it("仮置きを除くと解けない問題が、仮置きを含めると解ける", () => {
    const withoutTrial = runTechniqueAutoUntilNoChange(
      stuckInitialGrid(),
      allTechniqueIds.filter((id) => id !== TechniqueId.TRIAL_AND_ERROR),
      stuckSolution81,
    );
    expect(withoutTrial.grid.values().join("")).not.toBe(stuckSolution81);

    const withTrial = runTechniqueAutoUntilNoChange(
      stuckInitialGrid(),
      allTechniqueIds,
      stuckSolution81,
    );
    expect(withTrial.conflictCellIndex).toBeNull();
    expect(withTrial.grid.values().join("")).toBe(stuckSolution81);
    expect(
      withTrial.steps.some((s) => s.techniqueId === TechniqueId.TRIAL_AND_ERROR),
    ).toBe(true);
  });

  it("仮置きの手のあとも、空マスのメモに正解の数字が残っている", () => {
    const { steps } = runTechniqueAutoUntilNoChange(
      stuckInitialGrid(),
      allTechniqueIds,
      stuckSolution81,
    );
    const trialSteps = steps.filter(
      (s) => s.techniqueId === TechniqueId.TRIAL_AND_ERROR,
    );
    expect(trialSteps.length).toBeGreaterThan(0);

    for (const step of trialSteps) {
      for (let i = 0; i < 81; i++) {
        const cell = step.grid.cellAt(i);
        if (cell.value !== 0) continue;
        const solutionBit = 1 << (Number(stuckSolution81[i]) - 1);
        expect(cell.memoMask & solutionBit).not.toBe(0);
      }
    }
  });
});
