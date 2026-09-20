import type { Puzzle } from "@/lib/types/puzzle";
import { generatePuzzleSync } from "@/lib/workers/generate_puzzle_core";

/**
 * 生成を Worker に投げる。Worker を作れない・失敗した場合は
 * メインスレッドで同じ処理を走らせる（UI は数百ms〜数秒ブロックする）。
 */
export function requestGeneratedPuzzle(): Promise<Puzzle> {
  return new Promise((resolve, reject) => {
    const runFallback = () => {
      const result = generatePuzzleSync();
      if (result) resolve(result);
      else reject(new Error("generatePuzzleSync: failed after max attempts"));
    };

    let worker: Worker;
    try {
      worker = new Worker(new URL("./generate_puzzle.worker.ts", import.meta.url));
    } catch {
      runFallback();
      return;
    }

    worker.onmessage = (event: MessageEvent<Puzzle | null>) => {
      worker.terminate();
      if (event.data) resolve(event.data);
      else runFallback();
    };
    worker.onerror = () => {
      worker.terminate();
      runFallback();
    };
    worker.postMessage(null);
  });
}
