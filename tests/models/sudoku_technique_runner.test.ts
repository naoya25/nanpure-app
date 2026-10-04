import { describe, expect, it } from "vitest";

import {
  findApplicableTechniqueSteps,
  runTechniqueAutoUntilNoChange,
  runTechniqueStep,
} from "@/lib/models/sudoku_technique_runner";
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

describe("findApplicableTechniqueSteps", () => {
  it("初期盤面で使えるテクニックを適用順に列挙し、各手は単独適用と同じ結果になる", () => {
    const grid = initialGrid();
    const result = findApplicableTechniqueSteps(grid, manyEmptyCase.solution81);
    if (result.kind !== "ok") throw new Error("conflict は想定外");

    expect(result.steps.length).toBeGreaterThan(0);
    const ids = result.steps.map((s) => s.techniqueId);
    const orderIdx = ids.map((id) => allTechniqueIds.indexOf(id));
    expect(orderIdx).toEqual([...orderIdx].sort((a, b) => a - b));

    for (const step of result.steps) {
      const single = runTechniqueStep(grid, step.techniqueId, manyEmptyCase.solution81);
      expect(single?.grid.values()).toEqual(step.grid.values());
    }
  });

  it("先頭はヒント 1 手（maxSteps: 1）と同じテクニック", () => {
    const grid = initialGrid();
    const result = findApplicableTechniqueSteps(grid, manyEmptyCase.solution81);
    const first = runTechniqueAutoUntilNoChange(
      grid,
      allTechniqueIds,
      manyEmptyCase.solution81,
      { maxSteps: 1 },
    );
    if (result.kind !== "ok") throw new Error("conflict は想定外");
    expect(result.steps[0]!.techniqueId).toBe(first.steps[0]!.techniqueId);
  });

  it("仮置きは、ほかに使えるテクニックがあるときは含めない", () => {
    const result = findApplicableTechniqueSteps(
      initialGrid(),
      manyEmptyCase.solution81,
    );
    if (result.kind !== "ok") throw new Error("conflict は想定外");
    expect(
      result.steps.some((s) => s.techniqueId === TechniqueId.TRIAL_AND_ERROR),
    ).toBe(false);
  });

  it("解答と違う数字があるときは列挙せずにそのマスを返す", () => {
    const grid = initialGrid();
    const emptyIndex = grid.values().findIndex((v) => v === 0);
    const solutionDigit = Number(manyEmptyCase.solution81[emptyIndex]);
    const wrongDigit = (solutionDigit % 9) + 1;
    const values = [...grid.values()];
    values[emptyIndex] = wrongDigit;

    const result = findApplicableTechniqueSteps(
      SudokuGrid.fromValues(values),
      manyEmptyCase.solution81,
    );
    expect(result).toEqual({ kind: "conflict", conflictCellIndex: [emptyIndex] });
  });
});

describe("findApplicableTechniqueSteps の解説", () => {
  // 仮置きまで要る問題（上の TRIAL_AND_ERROR と同じ）を解き進めた全盤面で確かめる
  const puzzle81 =
    "006100907000800060013070004050200001000085006007001000700000000060003018021600030";
  const solution81 =
    "846132957275849163913576284354267891192485376687391542738914625569723418421658739";

  it("一覧に出るすべての手が、理由つきの解説を持つ", () => {
    const start = SudokuGrid.fromValues(parsePuzzle81(puzzle81).values);
    const { steps } = runTechniqueAutoUntilNoChange(start, allTechniqueIds, solution81);
    const boards = [start, ...steps.map((s) => s.grid)];

    for (const board of boards) {
      const result = findApplicableTechniqueSteps(board, solution81);
      if (result.kind !== "ok") throw new Error("conflict は想定外");
      for (const step of result.steps) {
        expect(step.explanation?.reason, step.techniqueId).toBeTruthy();
      }
    }
  });
});
