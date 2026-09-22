import { describe, expect, it } from "vitest";

import { PlayHistory } from "@/lib/models/play_history";
import {
  createPlaySession,
  playSessionReducer,
  type PlaySessionConfig,
  type PlaySessionState,
} from "@/lib/models/play_session";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";
import { parsePuzzle81 } from "@/lib/validates/grid";

import { SOLVER_CASES } from "@/tests/fixtures/solver";

function createSessionFromCase(
  puzzle81: string,
  solution81: string,
): PlaySessionState {
  const { values, fixed } = parsePuzzle81(puzzle81);
  const config: PlaySessionConfig = { fixed, solution81 };
  const history = PlayHistory.create(SudokuGrid.fromValues(values));
  return createPlaySession(config, history, 0);
}

function emptyIndices(state: PlaySessionState): number[] {
  return state.config.fixed
    .map((f, i) => (f ? -1 : i))
    .filter((i) => i >= 0);
}

describe("playSessionReducer", () => {
  const manyEmptyCase = SOLVER_CASES[1]!; // "case 1": several empty cells
  const nearlySolvedCase = SOLVER_CASES[0]!; // exactly one empty cell

  it("正解入力で history が進む", () => {
    const state0 = createSessionFromCase(
      manyEmptyCase.puzzle81,
      manyEmptyCase.solution81,
    );
    const [index] = emptyIndices(state0);
    const digit = Number(manyEmptyCase.solution81[index]);

    const state1 = playSessionReducer(state0, {
      type: "placeDigit",
      index,
      digit,
    });

    expect(state1.history.present.values()[index]).toBe(digit);
    expect(state1.mistakes).toBe(0);
    expect(state1.phase).toEqual({ kind: "playing" });
    expect(state1).not.toBe(state0);
  });

  it("誤入力で mistakes+1", () => {
    const state0 = createSessionFromCase(
      manyEmptyCase.puzzle81,
      manyEmptyCase.solution81,
    );
    const [index] = emptyIndices(state0);
    const correctDigit = Number(manyEmptyCase.solution81[index]);
    const wrongDigit = (correctDigit % 9) + 1;

    const state1 = playSessionReducer(state0, {
      type: "placeDigit",
      index,
      digit: wrongDigit,
    });

    expect(state1.mistakes).toBe(1);
    expect(state1.phase).toEqual({ kind: "playing" });
  });

  it("readOnly(fixed・正解済み)マスへの入力は無視", () => {
    const state0 = createSessionFromCase(
      manyEmptyCase.puzzle81,
      manyEmptyCase.solution81,
    );
    const fixedIndex = state0.config.fixed.findIndex((f) => f);

    const stateOnFixed = playSessionReducer(state0, {
      type: "placeDigit",
      index: fixedIndex,
      digit: 1,
    });
    expect(stateOnFixed).toBe(state0);

    const [index] = emptyIndices(state0);
    const digit = Number(manyEmptyCase.solution81[index]);
    const state1 = playSessionReducer(state0, {
      type: "placeDigit",
      index,
      digit,
    });
    const state2 = playSessionReducer(state1, {
      type: "placeDigit",
      index,
      digit,
    });
    expect(state2).toBe(state1);
  });

  it("全埋めで result(won true と false の両方)", () => {
    const state0 = createSessionFromCase(
      nearlySolvedCase.puzzle81,
      nearlySolvedCase.solution81,
    );
    const [index] = emptyIndices(state0);
    const correctDigit = Number(nearlySolvedCase.solution81[index]);

    const won = playSessionReducer(state0, {
      type: "placeDigit",
      index,
      digit: correctDigit,
    });
    expect(won.phase).toEqual({ kind: "result", won: true });

    // placeDigit は不一致のときに完了判定をしない（元実装の挙動を維持）ため、
    // 全埋め & 不一致は applyTechniqueStep 経由で再現する。
    const wrongDigit = (correctDigit % 9) + 1;
    const { next } = state0.history.present.placeDigit(index, wrongDigit);
    const lost = playSessionReducer(state0, {
      type: "applyTechniqueStep",
      step: {
        techniqueId: TechniqueId.SINGLE,
        cellIndex: [index],
        grid: next,
      },
    });
    expect(lost.phase).toEqual({ kind: "result", won: false });
    expect(lost.mistakes).toBe(1);
  });

  it("undo → redo で盤が戻る", () => {
    const state0 = createSessionFromCase(
      manyEmptyCase.puzzle81,
      manyEmptyCase.solution81,
    );
    const [index] = emptyIndices(state0);
    const digit = Number(manyEmptyCase.solution81[index]);

    const state1 = playSessionReducer(state0, {
      type: "placeDigit",
      index,
      digit,
    });
    const state2 = playSessionReducer(state1, { type: "undo" });
    expect(state2.history.present.values()).toEqual(
      state0.history.present.values(),
    );

    const state3 = playSessionReducer(state2, { type: "redo" });
    expect(state3.history.present.values()).toEqual(
      state1.history.present.values(),
    );
  });

  it("lock 中は placeDigit・undo を無視するが applyTechniqueStep は通る", () => {
    const state0 = createSessionFromCase(
      manyEmptyCase.puzzle81,
      manyEmptyCase.solution81,
    );
    const [firstIndex, secondIndex] = emptyIndices(state0);
    const firstDigit = Number(manyEmptyCase.solution81[firstIndex]);

    const state1 = playSessionReducer(state0, {
      type: "placeDigit",
      index: firstIndex,
      digit: firstDigit,
    });
    const locked = playSessionReducer(state1, { type: "beginPlayback" });
    expect(locked.playbackLocked).toBe(true);

    const secondDigit = Number(manyEmptyCase.solution81[secondIndex]);
    const afterPlaceDigit = playSessionReducer(locked, {
      type: "placeDigit",
      index: secondIndex,
      digit: secondDigit,
    });
    expect(afterPlaceDigit).toBe(locked);

    const afterUndo = playSessionReducer(locked, { type: "undo" });
    expect(afterUndo).toBe(locked);

    const { next } = locked.history.present.placeDigit(secondIndex, secondDigit);
    const afterStep = playSessionReducer(locked, {
      type: "applyTechniqueStep",
      step: {
        techniqueId: TechniqueId.SINGLE,
        cellIndex: [secondIndex],
        grid: next,
      },
    });
    expect(afterStep.history.present.values()[secondIndex]).toBe(secondDigit);
    expect(afterStep.playbackLocked).toBe(true);
    expect(afterStep.mistakes).toBe(locked.mistakes);
  });

  it("applyTechniqueStep で誤値が入ると mistakes 加算", () => {
    const state0 = createSessionFromCase(
      manyEmptyCase.puzzle81,
      manyEmptyCase.solution81,
    );
    const [index] = emptyIndices(state0);
    const correctDigit = Number(manyEmptyCase.solution81[index]);
    const wrongDigit = (correctDigit % 9) + 1;

    const { next } = state0.history.present.placeDigit(index, wrongDigit);
    const state1 = playSessionReducer(state0, {
      type: "applyTechniqueStep",
      step: {
        techniqueId: TechniqueId.SINGLE,
        cellIndex: [index],
        grid: next,
      },
    });

    expect(state1.history.present.values()[index]).toBe(wrongDigit);
    expect(state1.mistakes).toBe(1);
  });

  it("startReview で初期盤・exitReview で最終盤", () => {
    const state0 = createSessionFromCase(
      nearlySolvedCase.puzzle81,
      nearlySolvedCase.solution81,
    );
    const [index] = emptyIndices(state0);
    const correctDigit = Number(nearlySolvedCase.solution81[index]);

    const solved = playSessionReducer(state0, {
      type: "placeDigit",
      index,
      digit: correctDigit,
    });
    expect(solved.phase).toEqual({ kind: "result", won: true });

    const reviewing = playSessionReducer(solved, { type: "startReview" });
    expect(reviewing.phase).toEqual({ kind: "review", won: true });
    expect(reviewing.history.present.values()).toEqual(
      state0.history.present.values(),
    );

    const backToResult = playSessionReducer(reviewing, {
      type: "exitReview",
    });
    expect(backToResult.phase).toEqual({ kind: "result", won: true });
    expect(backToResult.history.present.values()).toEqual(
      solved.history.present.values(),
    );
  });
});
