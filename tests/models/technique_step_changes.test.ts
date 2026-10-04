import { describe, expect, it } from "vitest";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { describeTechniqueStepChanges } from "@/lib/models/technique_step_changes";

const EMPTY_VALUES = new Array<number>(81).fill(0);

describe("describeTechniqueStepChanges", () => {
  it("数字が入るマスと、候補が消えるマスを文にする", () => {
    const masks = new Array<number>(81).fill(0x1ff);
    const before = SudokuGrid.fromValuesAndCandidateMasks(EMPTY_VALUES, masks);
    const afterValues = [...EMPTY_VALUES];
    afterValues[0] = 7;
    const afterMasks = [...masks];
    afterMasks[10] = 0x1ff & ~0b10100;
    const after = SudokuGrid.fromValuesAndCandidateMasks(afterValues, afterMasks);

    expect(
      describeTechniqueStepChanges(before, { cellIndex: [0, 10], grid: after }),
    ).toEqual(["A1に 7 が入る", "B2から候補 3・5 を消す"]);
  });

  it("候補の書き込みはマス数にまとめる", () => {
    const before = SudokuGrid.fromValues(EMPTY_VALUES);
    const after = SudokuGrid.fromValuesAndCandidateMasks(
      EMPTY_VALUES,
      new Array<number>(81).fill(0x1ff),
    );
    expect(
      describeTechniqueStepChanges(before, { cellIndex: [0, 1, 2], grid: after }),
    ).toEqual(["空きマス 3 個に候補を書き込む"]);
  });
});
