import { PUZZLE_STOCK_TARGET_SIZE, push, stockCount } from "@/lib/storage/puzzle_stock";
import type { DifficultyPercent, Puzzle } from "@/lib/types/puzzle";
import { requestGeneratedPuzzle } from "@/lib/workers/generate_puzzle_client";

const inFlight = new Set<DifficultyPercent>();

export function replenishPuzzleStockInBackground(difficultyPercent: DifficultyPercent): void {
  if (inFlight.has(difficultyPercent)) return;
  inFlight.add(difficultyPercent);
  void (async () => {
    try {
      while (stockCount(difficultyPercent) < PUZZLE_STOCK_TARGET_SIZE) {
        try {
          push(await requestGeneratedPuzzle(difficultyPercent));
        } catch {
          return;
        }
      }
    } finally {
      inFlight.delete(difficultyPercent);
    }
  })();
}

export function returnPuzzleToStock(puzzle: Puzzle): void {
  push(puzzle);
}
