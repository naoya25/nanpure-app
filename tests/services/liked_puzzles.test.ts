import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LIKED_PUZZLES_MAX,
  isPuzzleLiked,
  listLikedPuzzles,
  setPuzzleLiked,
} from "@/lib/services/liked_puzzles";

const LIKED_KEY = "nanpure:liked:v1";

function puzzle81Of(n: number): string {
  return String(n).padStart(81, "0");
}

function stubLocalStorage(options?: { failWrites?: boolean }) {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (options?.failWrites) throw new Error("quota");
        store.set(key, value);
      },
    },
  });
}

describe("liked_puzzles", () => {
  beforeEach(() => {
    stubLocalStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("いいねした問題を新しい順に返し、外すと消える", () => {
    setPuzzleLiked({ puzzle_81: puzzle81Of(1), level: 10 }, true, 100);
    setPuzzleLiked({ puzzle_81: puzzle81Of(2), level: 20 }, true, 200);

    expect(listLikedPuzzles().map((p) => p.level)).toEqual([20, 10]);
    expect(isPuzzleLiked(puzzle81Of(1))).toBe(true);

    expect(setPuzzleLiked({ puzzle_81: puzzle81Of(1), level: 10 }, false)).toBe("ok");
    expect(isPuzzleLiked(puzzle81Of(1))).toBe(false);
  });

  it("同じ問題を 2 回いいねしても 1 件のまま", () => {
    setPuzzleLiked({ puzzle_81: puzzle81Of(1), level: 10 }, true, 100);
    setPuzzleLiked({ puzzle_81: puzzle81Of(1), level: 10 }, true, 200);
    expect(listLikedPuzzles()).toHaveLength(1);
  });

  it("上限に達したら保存を断り、既存のいいねは消さない", () => {
    for (let i = 0; i < LIKED_PUZZLES_MAX; i++) {
      setPuzzleLiked({ puzzle_81: puzzle81Of(i), level: 1 }, true, i);
    }
    expect(
      setPuzzleLiked({ puzzle_81: puzzle81Of(9999), level: 1 }, true),
    ).toBe("limit_reached");
    expect(listLikedPuzzles()).toHaveLength(LIKED_PUZZLES_MAX);
  });

  it("壊れた保存データは空として扱い、不正な要素は落とす", () => {
    window.localStorage.setItem(LIKED_KEY, "{not json");
    expect(listLikedPuzzles()).toEqual([]);

    window.localStorage.setItem(
      LIKED_KEY,
      JSON.stringify({
        v: 1,
        items: [
          { puzzle_81: puzzle81Of(1), level: 10, likedAt: 1 },
          { puzzle_81: "<script>", level: 10, likedAt: 1 },
          { puzzle_81: puzzle81Of(2), level: "x", likedAt: 1 },
        ],
      }),
    );
    expect(listLikedPuzzles().map((p) => p.puzzle_81)).toEqual([puzzle81Of(1)]);
  });

  it("localStorage に書けないときは storage_failed を返す", () => {
    stubLocalStorage({ failWrites: true });
    expect(setPuzzleLiked({ puzzle_81: puzzle81Of(1), level: 10 }, true)).toBe(
      "storage_failed",
    );
  });
});
