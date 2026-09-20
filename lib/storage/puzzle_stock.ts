import { getLocalStorageItem, setLocalStorageItem } from "@/lib/storage/local_storage";
import type { Puzzle } from "@/lib/types/puzzle";

const STOCK_KEY = "nanpure:stock:v1";

export const PUZZLE_STOCK_TARGET_SIZE = 3;

type PuzzleStockStateV1 = {
  v: 1;
  items: Puzzle[];
};

function isPuzzle(value: unknown): value is Puzzle {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.puzzle_81 === "string" &&
    typeof v.solution_81 === "string" &&
    typeof v.level === "number"
  );
}

function emptyState(): PuzzleStockStateV1 {
  return { v: 1, items: [] };
}

function readState(): PuzzleStockStateV1 {
  const raw = getLocalStorageItem(STOCK_KEY);
  if (raw === null) return emptyState();

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { v?: unknown }).v !== 1 ||
      !Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return emptyState();
    }
    return {
      v: 1,
      items: (parsed as { items: unknown[] }).items.filter(isPuzzle),
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: PuzzleStockStateV1): void {
  setLocalStorageItem(STOCK_KEY, JSON.stringify(state));
}

export function takeOne(): Puzzle | null {
  const state = readState();
  const [first, ...rest] = state.items;
  if (first === undefined) return null;
  writeState({ v: 1, items: rest });
  return first;
}

export function push(item: Puzzle): void {
  const state = readState();
  writeState({ v: 1, items: [...state.items, item] });
}

export function stockCount(): number {
  return readState().items.length;
}
