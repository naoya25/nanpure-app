import {
  loadLikedPuzzles,
  saveLikedPuzzles,
  type LikedPuzzle,
} from "@/lib/storage/liked_puzzles";

export type { LikedPuzzle };

/** いいねできる問題数の上限。超えたら古いものを黙って消さず、保存を断る */
export const LIKED_PUZZLES_MAX = 200;

export type SetPuzzleLikedOutcome = "ok" | "limit_reached" | "storage_failed";

/** いいねした問題を新しい順に返す */
export function listLikedPuzzles(): LikedPuzzle[] {
  return loadLikedPuzzles().sort((a, b) => b.likedAt - a.likedAt);
}

export function isPuzzleLiked(puzzle81: string): boolean {
  return loadLikedPuzzles().some((p) => p.puzzle_81 === puzzle81);
}

export function setPuzzleLiked(
  puzzle: { puzzle_81: string; level: number },
  liked: boolean,
  now: number = Date.now(),
): SetPuzzleLikedOutcome {
  const others = loadLikedPuzzles().filter(
    (p) => p.puzzle_81 !== puzzle.puzzle_81,
  );
  if (!liked) {
    return saveLikedPuzzles(others) ? "ok" : "storage_failed";
  }
  if (others.length >= LIKED_PUZZLES_MAX) return "limit_reached";
  const next = [
    ...others,
    { puzzle_81: puzzle.puzzle_81, level: puzzle.level, likedAt: now },
  ];
  return saveLikedPuzzles(next) ? "ok" : "storage_failed";
}
