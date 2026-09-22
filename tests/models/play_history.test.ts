import { describe, expect, it } from "vitest";

import { PlayHistory } from "@/lib/models/play_history";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";

function emptyGrid(): SudokuGrid {
  return SudokuGrid.fromValues(new Array(81).fill(0));
}

describe("PlayHistory.techniqueUsageOnCurrentPath", () => {
  it("初期盤だけなら byTechnique も manualSteps も 0", () => {
    const history = PlayHistory.create(emptyGrid());

    const usage = history.techniqueUsageOnCurrentPath();

    expect(usage.manualSteps).toBe(0);
    expect(usage.byTechnique.size).toBe(0);
  });

  it("手入力2手 + テクニック1手で manual 2・byTechnique 1", () => {
    const g0 = emptyGrid();
    const g1 = g0.placeDigit(0, 1).next;
    const g2 = g1.placeDigit(1, 2).next;
    const g3 = g2.placeDigit(2, 3).next;

    let history = PlayHistory.create(g0);
    history = history.recordNext(g1, null, [0]);
    history = history.recordNext(g2, null, [1]);
    history = history.recordNext(g3, TechniqueId.SINGLE, [2]);

    const usage = history.techniqueUsageOnCurrentPath();

    expect(usage.manualSteps).toBe(2);
    expect(usage.byTechnique.size).toBe(1);
    expect(usage.byTechnique.get(TechniqueId.SINGLE)).toBe(1);
  });

  it("undo で捨てた手はカウントしない", () => {
    const g0 = emptyGrid();
    const g1 = g0.placeDigit(0, 1).next;
    const g2 = g1.placeDigit(1, 2).next;

    let history = PlayHistory.create(g0);
    history = history.recordNext(g1, null, [0]);
    history = history.recordNext(g2, TechniqueId.SINGLE, [1]);
    history = history.undo();

    const usage = history.techniqueUsageOnCurrentPath();

    expect(usage.manualSteps).toBe(1);
    expect(usage.byTechnique.size).toBe(0);
  });

  it("redo で戻せば再びカウントする", () => {
    const g0 = emptyGrid();
    const g1 = g0.placeDigit(0, 1).next;
    const g2 = g1.placeDigit(1, 2).next;

    let history = PlayHistory.create(g0);
    history = history.recordNext(g1, null, [0]);
    history = history.recordNext(g2, TechniqueId.SINGLE, [1]);
    history = history.undo();
    history = history.redo();

    const usage = history.techniqueUsageOnCurrentPath();

    expect(usage.manualSteps).toBe(1);
    expect(usage.byTechnique.get(TechniqueId.SINGLE)).toBe(1);
  });
});
