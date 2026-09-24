import { describe, expect, it } from "vitest";

import {
  ALL_TECHNIQUE_IDS,
  TECHNIQUE_LABELS,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";

describe("types/sudoku_technique_types", () => {
  it("画面の並び（TECHNIQUE_LABELS）は全テクニックをちょうど 1 回ずつ含む", () => {
    const displayed = TECHNIQUE_LABELS.map((t) => t.id);
    expect([...displayed].sort()).toEqual([...ALL_TECHNIQUE_IDS].sort());
  });

  it("仮置きは適用順の末尾にある（他のテクニックより先に発火しない）", () => {
    expect(ALL_TECHNIQUE_IDS[ALL_TECHNIQUE_IDS.length - 1]).toBe(
      TechniqueId.TRIAL_AND_ERROR,
    );
  });
});
