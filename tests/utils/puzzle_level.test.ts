import { describe, expect, it } from "vitest";

import { PUZZLE_LEVEL_MAX, PUZZLE_LEVEL_MIN } from "@/lib/types/puzzle";
import { clampScoreToPuzzleLevel } from "@/lib/utils/puzzle_level";

describe("clampScoreToPuzzleLevel", () => {
  it("範囲内はそのまま（整数に丸め）", () => {
    expect(clampScoreToPuzzleLevel(73.4)).toBe(73);
    expect(clampScoreToPuzzleLevel(PUZZLE_LEVEL_MIN)).toBe(PUZZLE_LEVEL_MIN);
    expect(clampScoreToPuzzleLevel(PUZZLE_LEVEL_MAX)).toBe(PUZZLE_LEVEL_MAX);
  });

  it("上下はクランプ", () => {
    expect(clampScoreToPuzzleLevel(0)).toBe(PUZZLE_LEVEL_MIN);
    expect(clampScoreToPuzzleLevel(999)).toBe(PUZZLE_LEVEL_MAX);
  });
});
