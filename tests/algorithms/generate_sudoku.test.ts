import { describe, expect, it } from "vitest";

import {
  generateSudokuPuzzlePair,
  refillHolesToRatio,
} from "@/lib/algorithms/generate_sudoku";
import { sudokuSolutionCountKind } from "@/lib/algorithms/sudoku_solver";

function createLcgRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function countHoles(puzzle81: string): number {
  return [...puzzle81].filter((c) => c === "0").length;
}

describe("algorithms/generate_sudoku", () => {
  it("refillHolesToRatio: ratio 1 は puzzle81 をそのまま返す", () => {
    const puzzle81 = "1".repeat(80) + "0";
    const solution81 = "1".repeat(81);
    expect(refillHolesToRatio(puzzle81, solution81, 1, createLcgRandom(1))).toBe(puzzle81);
  });

  it("refillHolesToRatio: 残す穴の数は round(穴の数 * ratio)", () => {
    const solution81 = "1".repeat(81);
    const puzzle81 = "0".repeat(81);
    const refilled = refillHolesToRatio(puzzle81, solution81, 0.5, createLcgRandom(42));
    expect(countHoles(refilled)).toBe(Math.round(81 * 0.5));
  });

  it("refillHolesToRatio: ratio が (0, 1] の範囲外なら throw する", () => {
    const solution81 = "1".repeat(81);
    expect(() => refillHolesToRatio(solution81, solution81, 0, createLcgRandom(1))).toThrow();
    expect(() => refillHolesToRatio(solution81, solution81, 1.5, createLcgRandom(1))).toThrow();
  });

  for (const seed of [1, 2, 3]) {
    it(`generateSudokuPuzzlePair: seed=${seed} で 100% と 50% を比較`, () => {
      const full = generateSudokuPuzzlePair(createLcgRandom(seed), 100);
      const half = generateSudokuPuzzlePair(createLcgRandom(seed), 50);
      expect(full).not.toBeNull();
      expect(half).not.toBeNull();
      if (full === null || half === null) return;

      expect(half.solution_81).toBe(full.solution_81);

      const fullHoles = countHoles(full.puzzle_81);
      const halfHoles = countHoles(half.puzzle_81);
      expect(halfHoles).toBe(Math.round(fullHoles * 0.5));

      const halfKind = sudokuSolutionCountKind(half.puzzle_81);
      expect(halfKind.kind).toBe("unique");
      if (halfKind.kind === "unique") {
        expect(halfKind.solution81).toBe(half.solution_81);
      }

      for (let i = 0; i < full.puzzle_81.length; i++) {
        if (full.puzzle_81[i] !== "0") {
          expect(half.puzzle_81[i]).toBe(full.puzzle_81[i]);
        }
      }
    });
  }
});
