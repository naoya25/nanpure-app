import { describe, expect, it } from "vitest";

import {
  SOLVED_DIFFICULTY_SCORE_MAX,
  SOLVED_DIFFICULTY_SCORE_MIN,
  SOLVED_RAW_SCORE_LEVEL_THRESHOLDS,
  TECHNIQUE_RARITY_WEIGHT,
  UNSOLVED_DIFFICULTY_MAX,
  UNSOLVED_DIFFICULTY_MIN,
  computeSolvedRawScore,
  computeSudokuDifficultyScore,
  computeUnsolvedDifficultyFromEmptyCells,
  solvedLevelFromRawScore,
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

  it("難しい手筋を何度も使う問題は、1 回だけの問題より Level が高い", () => {
    const once = computeSudokuDifficultyScore({
      techniqueStepCounts: {
        [TechniqueId.SINGLE]: 30,
        [TechniqueId.HIDDEN_SINGLE]: 10,
        [TechniqueId.PENCIL_MARK]: 1,
        [TechniqueId.ALS_XZ]: 1,
      },
      solved: true,
    });
    const many = computeSudokuDifficultyScore({
      techniqueStepCounts: {
        [TechniqueId.SINGLE]: 30,
        [TechniqueId.HIDDEN_SINGLE]: 10,
        [TechniqueId.PENCIL_MARK]: 1,
        [TechniqueId.ALS_XZ]: 6,
      },
      solved: true,
    });
    expect(many.rawLinearScore).toBeGreaterThan(once.rawLinearScore);
    expect(many.difficultyScore100).toBeGreaterThan(once.difficultyScore100);
  });

  it("解けた問題の Level は 1〜100 に収まる", () => {
    const easiest = computeSudokuDifficultyScore({ techniqueStepCounts: {}, solved: true });
    const hardest = computeSudokuDifficultyScore({
      techniqueStepCounts: { [TechniqueId.TRIAL_AND_ERROR]: 100 },
      solved: true,
    });
    expect(easiest.difficultyScore100).toBe(SOLVED_DIFFICULTY_SCORE_MIN);
    expect(hardest.difficultyScore100).toBe(SOLVED_DIFFICULTY_SCORE_MAX);
  });
});

describe("TECHNIQUE_RARITY_WEIGHT", () => {
  it("どの問題でも使うシングルはほぼ 0、めったに使わない手筋ほど重い", () => {
    expect(TECHNIQUE_RARITY_WEIGHT[TechniqueId.SINGLE]).toBeLessThan(0.01);
    expect(TECHNIQUE_RARITY_WEIGHT[TechniqueId.ALS_XZ]).toBeGreaterThan(
      TECHNIQUE_RARITY_WEIGHT[TechniqueId.POINTING],
    );
    expect(TECHNIQUE_RARITY_WEIGHT[TechniqueId.TRIAL_AND_ERROR]).toBeGreaterThan(
      TECHNIQUE_RARITY_WEIGHT[TechniqueId.ALS_XZ],
    );
  });

  it("使用率 0% の手筋も有限の重みになる", () => {
    expect(Number.isFinite(TECHNIQUE_RARITY_WEIGHT[TechniqueId.FISH_88])).toBe(true);
  });
});

describe("computeSolvedRawScore", () => {
  it("回数 × 希少度の和。0 以下の回数は無視する", () => {
    expect(
      computeSolvedRawScore({
        [TechniqueId.AIC]: 2,
        [TechniqueId.SINGLE]: -1,
      } as Record<TechniqueId, number>),
    ).toBeCloseTo(2 * TECHNIQUE_RARITY_WEIGHT[TechniqueId.AIC], 10);
  });
});

describe("solvedLevelFromRawScore", () => {
  it("境目を超えるたびに Level が 1 上がる（境目ちょうどは上がらない）", () => {
    const thresholds = [1, 2, 3];
    expect(solvedLevelFromRawScore(0, thresholds)).toBe(1);
    expect(solvedLevelFromRawScore(1, thresholds)).toBe(1);
    expect(solvedLevelFromRawScore(1.5, thresholds)).toBe(2);
    expect(solvedLevelFromRawScore(9, thresholds)).toBe(4);
  });

  it("目盛りは 99 個の昇順", () => {
    expect(SOLVED_RAW_SCORE_LEVEL_THRESHOLDS).toHaveLength(99);
    const sorted = [...SOLVED_RAW_SCORE_LEVEL_THRESHOLDS].sort((a, b) => a - b);
    expect(SOLVED_RAW_SCORE_LEVEL_THRESHOLDS).toEqual(sorted);
  });
});

describe("computeUnsolvedDifficultyFromEmptyCells", () => {
  it("空マス 0 なら 100", () => {
    expect(computeUnsolvedDifficultyFromEmptyCells(0).difficultyScore100).toBe(100);
  });
});
