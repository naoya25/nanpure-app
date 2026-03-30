import { describe, expect, it } from "vitest";

import { runTechniqueStep } from "@/lib/models/sudoku_technique_runner";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { parsePuzzle81 } from "@/lib/validates/grid";
import { TECHNIQUE_CASES } from "@/tests/fixtures/techniques";

function makeGrid(values81: string, candidateMasks81: number[]) {
  const parsed = parsePuzzle81(values81);
  if (candidateMasks81.length !== 81) {
    throw new Error("test fixture must provide 81-length candidateMasks81");
  }
  return SudokuGrid.fromValuesAndCandidateMasks(
    parsed.values,
    candidateMasks81,
  );
}

function collectMemoMasks(grid: SudokuGrid): number[] {
  return Array.from({ length: 81 }, (_, i) => grid.cellAt(i).memoMask);
}

describe("algorithms/techniques", () => {
  it("user-provided technique cases", () => {
    for (const c of TECHNIQUE_CASES) {
      const grid = makeGrid(c.input.values81, c.input.candidateMasks81);
      const res = runTechniqueStep(grid, c.techniqueId, c.solution81);

      if (c.expected === null) {
        expect(res).toBeNull();
        continue;
      }

      expect(res).not.toBeNull();

      const out = res!.grid;
      const outValues = out.values();
      const expectedValues = parsePuzzle81(c.expected.values81).values;
      expect(outValues).toEqual(expectedValues);

      const outMemoMasks = collectMemoMasks(out);
      expect(outMemoMasks).toEqual(c.expected.candidateMasks81);
    }
  });
});
