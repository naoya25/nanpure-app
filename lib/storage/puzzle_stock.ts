import { getLocalStorageItem, setLocalStorageItem } from "@/lib/storage/local_storage";
import { isDifficultyPercent } from "@/lib/types/puzzle";
import type { DifficultyPercent, Puzzle } from "@/lib/types/puzzle";
import { SUDOKU_CELLS } from "@/lib/validates/grid";

const STOCK_KEY = "nanpure:stock:v2";

/** 難易度ごとの目標在庫数 */
export const PUZZLE_STOCK_TARGET_SIZE = 3;

/** 難易度ごとの在庫上限 */
export const PUZZLE_STOCK_MAX_SIZE = 12;

type PuzzleStockStateV2 = {
  v: 2;
  items: Puzzle[];
};

function isPuzzle(value: unknown): value is Puzzle {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.puzzle_81 === "string" &&
    v.puzzle_81.length === SUDOKU_CELLS &&
    typeof v.solution_81 === "string" &&
    v.solution_81.length === SUDOKU_CELLS &&
    typeof v.level === "number" &&
    isDifficultyPercent(v.difficultyPercent)
  );
}

function emptyState(): PuzzleStockStateV2 {
  return { v: 2, items: [] };
}

function readState(): PuzzleStockStateV2 {
  const raw = getLocalStorageItem(STOCK_KEY);
  if (raw === null) return emptyState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { v?: unknown }).v !== 2 ||
      !Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return emptyState();
    }
    return {
      v: 2,
      items: (parsed as { items: unknown[] }).items.filter(isPuzzle),
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: PuzzleStockStateV2): void {
  setLocalStorageItem(STOCK_KEY, JSON.stringify(state));
}

export function takeOne(difficultyPercent: DifficultyPercent): Puzzle | null {
  const state = readState();
  const index = state.items.findIndex((item) => item.difficultyPercent === difficultyPercent);
  if (index === -1) return null;

  const item = state.items[index]!;
  const rest = [...state.items.slice(0, index), ...state.items.slice(index + 1)];
  writeState({ v: 2, items: rest });
  return item;
}

export function push(item: Puzzle): void {
  const state = readState();
  if (state.items.some((existing) => existing.puzzle_81 === item.puzzle_81)) {
    return;
  }
  const sameDifficultyCount = state.items.filter(
    (existing) => existing.difficultyPercent === item.difficultyPercent,
  ).length;
  if (sameDifficultyCount >= PUZZLE_STOCK_MAX_SIZE) return;
  writeState({ v: 2, items: [...state.items, item] });
}

export function stockCount(difficultyPercent: DifficultyPercent): number {
  return readState().items.filter((item) => item.difficultyPercent === difficultyPercent).length;
}
