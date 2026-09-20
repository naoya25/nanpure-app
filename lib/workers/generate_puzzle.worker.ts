import type { Puzzle } from "@/lib/types/puzzle";
import { generatePuzzleSync } from "@/lib/workers/generate_puzzle_core";

/**
 * Worker のエントリ。メインスレッド側の窓口は `generate_puzzle_client.ts`。
 *
 * 踏んだ落とし穴が 2 つある。どちらもビルドは成功するので気づきにくい:
 *
 * 1. **このファイルから `new Worker` を呼ばない** — 自分自身を worker として
 *    参照するとモジュールグラフが循環し、Turbopack のビルドが
 *    `Creating an optimized production build ...` のまま停止する。
 * 2. **`typeof window === "undefined"` でガードしない** — webpack はクライアント
 *    ビルドで `typeof window` を `"object"` に畳むため、条件が常に false になり
 *    この登録ごと dead code として削除される。worker は起動するのに無言のまま
 *    応答しなくなる。
 */
type DedicatedWorkerMessageScope = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: Puzzle | null) => void;
};

const workerScope = self as unknown as DedicatedWorkerMessageScope;

workerScope.onmessage = () => {
  workerScope.postMessage(generatePuzzleSync());
};
