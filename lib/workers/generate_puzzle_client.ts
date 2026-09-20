import type { Puzzle } from "@/lib/types/puzzle";
import { generatePuzzleSync } from "@/lib/workers/generate_puzzle_core";

/**
 * worker が無言のまま応答しない事故が実際に起きたため、待ちっぱなしにしない。
 * 生成は実測で最大 2283ms なので、15 秒は正常系には掛からない。
 */
const WORKER_TIMEOUT_MS = 15_000;

/**
 * 生成を Worker に投げる。Worker を作れない・失敗した・時間内に返らない場合は
 * メインスレッドで同じ処理を走らせる（UI は数百ms〜数秒ブロックする）。
 */
export function requestGeneratedPuzzle(): Promise<Puzzle> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const settle = (run: () => void) => {
      if (settled) return;
      settled = true;
      run();
    };

    const runFallback = () =>
      settle(() => {
        const result = generatePuzzleSync();
        if (result) resolve(result);
        else reject(new Error("generatePuzzleSync: failed after max attempts"));
      });

    let worker: Worker;
    try {
      worker = new Worker(new URL("./generate_puzzle.worker.ts", import.meta.url));
    } catch {
      runFallback();
      return;
    }

    const timer = setTimeout(() => {
      worker.terminate();
      runFallback();
    }, WORKER_TIMEOUT_MS);

    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<Puzzle | null>) => {
      finish();
      const puzzle = event.data;
      if (puzzle) settle(() => resolve(puzzle));
      else runFallback();
    };
    worker.onerror = () => {
      finish();
      runFallback();
    };

    worker.postMessage(null);
  });
}
