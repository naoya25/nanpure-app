import { describe, expect, it } from "vitest";

import {
  puzzleSessionReducer,
  requestFromQuery,
  type PuzzleSessionState,
} from "@/lib/services/puzzle_session";

const SAMPLE_PUZZLE_81 = "1".repeat(81);

describe("requestFromQuery", () => {
  it("p があれば shared 要求になる", () => {
    const request = requestFromQuery(SAMPLE_PUZZLE_81, null, 100);
    expect(request).toEqual({
      key: `p:${SAMPLE_PUZZLE_81}`,
      kind: "shared",
      puzzle81: SAMPLE_PUZZLE_81,
    });
  });

  it("p が無く d があれば new 要求になる", () => {
    const request = requestFromQuery(null, "70", 100);
    expect(request).toEqual({ key: "d:70", kind: "new", difficulty: 70 });
  });

  it("どちらも無ければ保存値で new 要求になる", () => {
    const request = requestFromQuery(null, null, 90);
    expect(request).toEqual({ key: "d:90", kind: "new", difficulty: 90 });
  });

  it("p と d が両方あれば p を優先する", () => {
    const request = requestFromQuery(SAMPLE_PUZZLE_81, "70", 100);
    expect(request).toEqual({
      key: `p:${SAMPLE_PUZZLE_81}`,
      kind: "shared",
      puzzle81: SAMPLE_PUZZLE_81,
    });
  });
});

describe("puzzleSessionReducer", () => {
  it("同じ key の request は同一参照を返す", () => {
    const initial: PuzzleSessionState = { status: "idle" };
    const request = requestFromQuery(null, "70", 100);
    const afterFirst = puzzleSessionReducer(initial, {
      type: "request",
      request,
    });

    const sameKeyRequest = requestFromQuery(null, "70", 100);
    const afterSecond = puzzleSessionReducer(afterFirst, {
      type: "request",
      request: sameKeyRequest,
    });

    expect(afterSecond).toBe(afterFirst);
  });

  it("古い resolved を捨てる", () => {
    const initial: PuzzleSessionState = { status: "idle" };
    const staleRequest = requestFromQuery(null, "70", 100);
    const afterStaleRequest = puzzleSessionReducer(initial, {
      type: "request",
      request: staleRequest,
    });

    const newRequest = requestFromQuery(null, "90", 100);
    const afterNewRequest = puzzleSessionReducer(afterStaleRequest, {
      type: "request",
      request: newRequest,
    });

    const staleResolved = puzzleSessionReducer(afterNewRequest, {
      type: "resolved",
      request: staleRequest,
      outcome: {
        outcome: "ok",
        puzzle: {
          puzzle_81: SAMPLE_PUZZLE_81,
          solution_81: "2".repeat(81),
          level: 50,
          difficultyPercent: 70,
        },
      },
    });

    expect(staleResolved).toBe(afterNewRequest);
  });
});
