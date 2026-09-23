import { PUZZLE_STOCK_TARGET_SIZE, push, stockCount } from "@/lib/storage/puzzle_stock";
import type { DifficultyPercent } from "@/lib/types/puzzle";
import { requestGeneratedPuzzle } from "@/lib/workers/generate_puzzle_client";

export function replenishPuzzleStockInBackground(difficultyPercent: DifficultyPercent): void {
  void (async () => {
    while (stockCount(difficultyPercent) < PUZZLE_STOCK_TARGET_SIZE) {
      try {
        push(await requestGeneratedPuzzle(difficultyPercent));
      } catch {
        return;
      }
    }
  })();
}
