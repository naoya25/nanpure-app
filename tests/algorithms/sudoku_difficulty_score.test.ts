import { describe, expect, it } from "vitest";

import {
  SOLVED_RAW_BONUS,
  UNSOLVED_MATE_RAW_SCORE,
  computeLinearDifficultyScore,
  computeSudokuDifficultyScore,
  TECHNIQUE_RARITY_WEIGHT,
} from "@/lib/algorithms/sudoku_difficulty_score";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";

describe("computeSudokuDifficultyScore", () => {
  it("解けない場合は難易度 100（メイト級加点）", () => {
    const r = computeSudokuDifficultyScore({
      techniqueStepCounts: { [TechniqueId.SINGLE]: 5 },
      solved: false,
    });
    expect(r.difficultyScore100).toBe(100);
    expect(r.rawLinearScore).toBeGreaterThan(UNSOLVED_MATE_RAW_SCORE * 0.99);
  });

  it("解けた場合は y=x/(1+x) を 100 倍（整数四捨五入）", () => {
    const w = TECHNIQUE_RARITY_WEIGHT[TechniqueId.FULL_HOUSE] ?? 1;
    const n = 3;
    const raw = w * n + SOLVED_RAW_BONUS;
    const expected = Math.round(100 * (raw / (1 + raw)));
    const r = computeSudokuDifficultyScore({
      techniqueStepCounts: { [TechniqueId.FULL_HOUSE]: n },
      solved: true,
    });
    expect(r.difficultyScore100).toBe(expected);
    expect(r.rawLinearScore).toBe(raw);
  });

  it("使用ゼロ・解けた場合でもボーナスで正の点になる", () => {
    const raw = SOLVED_RAW_BONUS;
    const r = computeSudokuDifficultyScore({
      techniqueStepCounts: {},
      solved: true,
    });
    expect(r.rawLinearScore).toBe(raw);
    expect(r.difficultyScore100).toBe(Math.round(100 * (raw / (1 + raw))));
  });
});

describe("computeLinearDifficultyScore", () => {
  it("負や 0 の回数は無視", () => {
    expect(
      computeLinearDifficultyScore(
        {
          [TechniqueId.SINGLE]: -1,
          [TechniqueId.PAIR]: 0,
        },
        true,
      ),
    ).toBe(SOLVED_RAW_BONUS);
  });
});
