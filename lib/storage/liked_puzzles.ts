import { getLocalStorageItem, setLocalStorageItem } from "@/lib/storage/local_storage";

const LIKED_KEY = "nanpure:liked:v1";

export type LikedPuzzle = {
  puzzle_81: string;
  level: number;
  /** いいねした時刻（`Date.now()`） */
  likedAt: number;
};

type LikedPuzzlesStateV1 = {
  v: 1;
  items: LikedPuzzle[];
};

function isLikedPuzzle(value: unknown): value is LikedPuzzle {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.puzzle_81 === "string" &&
    /^[0-9]{81}$/.test(v.puzzle_81) &&
    typeof v.level === "number" &&
    Number.isFinite(v.level) &&
    typeof v.likedAt === "number" &&
    Number.isFinite(v.likedAt)
  );
}

export function loadLikedPuzzles(): LikedPuzzle[] {
  const raw = getLocalStorageItem(LIKED_KEY);
  if (raw === null) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { v?: unknown }).v !== 1 ||
      !Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return [];
    }
    return (parsed as { items: unknown[] }).items.filter(isLikedPuzzle);
  } catch {
    return [];
  }
}

export function saveLikedPuzzles(items: readonly LikedPuzzle[]): boolean {
  const state: LikedPuzzlesStateV1 = { v: 1, items: [...items] };
  return setLocalStorageItem(LIKED_KEY, JSON.stringify(state));
}
