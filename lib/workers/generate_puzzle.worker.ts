import { generatePuzzleSync } from "@/lib/workers/generate_puzzle_core";
import type { Puzzle } from "@/lib/types/puzzle";

/**
 * Worker のエントリ。**このファイルから `new Worker` を呼ばないこと** —
 * 自分自身を worker として参照するとモジュールグラフが循環し、
 * Turbopack のビルドが `Creating an optimized production build ...` で停止する。
 * メインスレッド側の窓口は `generate_puzzle_client.ts`。
 */
type DedicatedWorkerMessageScope = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: Puzzle | null) => void;
};

if (typeof self !== "undefined" && typeof window === "undefined") {
  const workerScope = self as unknown as DedicatedWorkerMessageScope;
  workerScope.onmessage = () => {
    workerScope.postMessage(generatePuzzleSync());
  };
}
