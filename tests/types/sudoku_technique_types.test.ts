import { describe, expect, it } from "vitest";

import { TECHNIQUE_LEARNING_STEPS } from "@/lib/types/technique_learning";

import {
  ALL_TECHNIQUE_IDS,
  TECHNIQUE_IMPORTANCE_LABELS,
  TECHNIQUE_LABELS,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";

describe("types/sudoku_technique_types", () => {
  it("画面の並び（TECHNIQUE_LABELS）は全テクニックをちょうど 1 回ずつ含む", () => {
    const displayed = TECHNIQUE_LABELS.map((t) => t.id);
    expect([...displayed].sort()).toEqual([...ALL_TECHNIQUE_IDS].sort());
  });

  it("重要度順（TECHNIQUE_IMPORTANCE_LABELS）は全テクニックをちょうど 1 回ずつ含む", () => {
    const hinted = TECHNIQUE_IMPORTANCE_LABELS.map((t) => t.id);
    expect([...hinted].sort()).toEqual([...ALL_TECHNIQUE_IDS].sort());
  });

  it("仮置きは適用順の末尾にある（他のテクニックより先に発火しない）", () => {
    expect(ALL_TECHNIQUE_IDS[ALL_TECHNIQUE_IDS.length - 1]).toBe(
      TechniqueId.TRIAL_AND_ERROR,
    );
  });
});

describe("types/technique_learning", () => {
  it("学習順（TECHNIQUE_LEARNING_STEPS）は全テクニックをちょうど 1 回ずつ含む", () => {
    const ids = TECHNIQUE_LEARNING_STEPS.map((s) => s.id);
    expect([...ids].sort()).toEqual([...ALL_TECHNIQUE_IDS].sort());
  });

  it("解ける問題数は学習順に減らない", () => {
    const counts = TECHNIQUE_LEARNING_STEPS.map((s) => s.solvablePuzzleCount);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
  });
});
