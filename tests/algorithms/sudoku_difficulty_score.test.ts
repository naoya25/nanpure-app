import { describe, expect, it } from "vitest";

import {
  SOLVED_DIFFICULTY_SCORE_MIN,
  SOLVED_ZERO_STEP_BASE_SCORE,
  TECHNIQUE_DIFFICULTY_BASE,
  UNSOLVED_DIFFICULTY_MAX,
  UNSOLVED_DIFFICULTY_MIN,
  computeSolvedDifficultyPreliminary,
  computeSudokuDifficultyScore,
  computeUnsolvedDifficultyFromEmptyCells,
} from "@/lib/algorithms/sudoku_difficulty_score";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";
import { SUDOKU_CELLS } from "@/lib/validates/grid";

describe("computeSudokuDifficultyScore", () => {
  it("解けない場合・空マス省略時は 81 扱いで 100+81", () => {
    const r = computeSudokuDifficultyScore({
      techniqueStepCounts: { [TechniqueId.SINGLE]: 5 },
      solved: false,
    });
    expect(r.difficultyScore100).toBe(UNSOLVED_DIFFICULTY_MIN + SUDOKU_CELLS);
    expect(r.rawLinearScore).toBe(UNSOLVED_DIFFICULTY_MAX);
    expect(r.normalized01).toBe(1);
    expect(r.baselineMaxTechniqueDifficulty).toBeUndefined();
  });

  it("解けない場合・空マスを渡すと 100+その数", () => {
    const r = computeSudokuDifficultyScore({
      techniqueStepCounts: {},
      solved: false,
      emptyCellsRemaining: 12,
    });
    expect(r.difficultyScore100).toBe(112);
    expect(r.rawLinearScore).toBe(112);
  });

  it("解けた場合は使ったテクニックの最高固定難易度を基準にする", () => {
    const r = computeSudokuDifficultyScore({
      techniqueStepCounts: {
        [TechniqueId.SINGLE]: 10,
        [TechniqueId.AIC]: 1,
      },
      solved: true,
    });
    expect(r.baselineMaxTechniqueDifficulty).toBe(TECHNIQUE_DIFFICULTY_BASE[TechniqueId.AIC]);
    expect(r.difficultyScore100).toBeGreaterThanOrEqual(SOLVED_DIFFICULTY_SCORE_MIN);
    expect(r.difficultyScore100).toBeLessThanOrEqual(100);
  });

  it("ステップ 0 のときは SOLVED_ZERO_STEP_BASE_SCORE を下限 50 にクランプ", () => {
    const r = computeSudokuDifficultyScore({
      techniqueStepCounts: {},
      solved: true,
    });
    expect(r.rawLinearScore).toBe(SOLVED_ZERO_STEP_BASE_SCORE);
    expect(r.difficultyScore100).toBe(SOLVED_DIFFICULTY_SCORE_MIN);
  });
});

describe("computeUnsolvedDifficultyFromEmptyCells", () => {
  it("空マス 0 なら 100", () => {
    const u = computeUnsolvedDifficultyFromEmptyCells(0);
    expect(u.difficultyScore100).toBe(100);
    expect(u.normalized01).toBeCloseTo(50 / (UNSOLVED_DIFFICULTY_MAX - SOLVED_DIFFICULTY_SCORE_MIN), 10);
  });
});

describe("computeSolvedDifficultyPreliminary", () => {
  it("基準より易しい手の回数が微加点になる", () => {
    const a = computeSolvedDifficultyPreliminary({
      [TechniqueId.AIC]: 1,
      [TechniqueId.SINGLE]: 20,
    });
    const b = computeSolvedDifficultyPreliminary({
      [TechniqueId.AIC]: 1,
    });
    expect(a.preliminary).toBeGreaterThan(b.preliminary);
    expect(a.baselineMax).toBe(TECHNIQUE_DIFFICULTY_BASE[TechniqueId.AIC]);
  });

  it("負の回数は無視相当（未使用のみならゼロステップ扱い）", () => {
    expect(
      computeSolvedDifficultyPreliminary({
        [TechniqueId.SINGLE]: -1,
      } as Record<TechniqueId, number>),
    ).toEqual({
      preliminary: SOLVED_ZERO_STEP_BASE_SCORE,
      baselineMax: undefined,
    });
  });
});
