import { describe, expect, it } from "vitest";

import {
  sudokuCheckAll,
  sudokuEnumerateSolutions,
  sudokuFindNext,
  sudokuSolutionCountKind,
} from "@/lib/algorithms/sudoku_solver";

import { SOLVER_CASES } from "@/tests/fixtures/solver";

describe("algorithms/sudoku_solver", () => {
  it("sudokuCheckAll: accepts a valid solved grid", () => {
    // まず fixture の解答で sanity
    const solved = SOLVER_CASES[0]!.solution81;
    expect(sudokuCheckAll(solved)).toBe(true);
  });

  it("sudokuCheckAll: rejects a grid with duplicates", () => {
    // 1 cell duplication: change one digit to an existing digit in its row/col/box.
    const bad =
      "534678912672195348198342567859761423426853791713924856961537284287419635345286178";
    expect(sudokuCheckAll(bad)).toBe(false);
  });

  it("sudokuFindNext: returns next empty position and options", () => {
    const puzzle = SOLVER_CASES[0]!.puzzle81;
    const next = sudokuFindNext(puzzle);
    expect(next).not.toBeNull();
    expect(next!.index).toBe(0);
    expect(next!.options).toEqual(["5"]);
  });

  it("derives provided answers: Solution should match fixture", () => {
    for (const c of SOLVER_CASES) {
      const res = sudokuSolutionCountKind(c.puzzle81);
      expect(res.kind).toBe("unique");
      if (res.kind !== "unique") continue;

      expect(res.solution81).toBe(c.solution81);

      const sols = sudokuEnumerateSolutions(c.puzzle81, 2);
      expect(sols).toHaveLength(1);
      expect(sols[0]).toBe(c.solution81);
    }
  });
});
