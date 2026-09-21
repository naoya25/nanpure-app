import { PUZZLE_STOCK_TARGET_SIZE, push, stockCount } from "@/lib/storage/puzzle_stock";
import { requestGeneratedPuzzle } from "@/lib/workers/generate_puzzle_client";

export function replenishPuzzleStockInBackground(): void {
  void (async () => {
    while (stockCount() < PUZZLE_STOCK_TARGET_SIZE) {
      try {
        push(await requestGeneratedPuzzle());
      } catch {
        return;
      }
    }
  })();
}
