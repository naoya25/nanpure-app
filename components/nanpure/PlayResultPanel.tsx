import Link from "next/link";

import {
  TECHNIQUE_LABELS,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";
import { techniqueIdWebSearchUrl } from "@/lib/utils/technique_web_search";

function techniqueLabel(id: TechniqueId): string {
  return TECHNIQUE_LABELS.find((t) => t.id === id)?.label ?? id;
}

function TechniqueUsageList({
  byTechnique,
  manualSteps,
}: {
  byTechnique: ReadonlyMap<TechniqueId, number>;
  manualSteps: number;
}) {
  if (byTechnique.size === 0 && manualSteps === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
      <p className="text-sm font-medium text-zinc-800">
        この解答で使ったテクニック
        <span className="ml-2 text-xs font-normal text-zinc-500">
          undo で戻した手は含みません
        </span>
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-700">
        {[...byTechnique].map(([id, count]) => (
          <li key={id} className="flex items-center justify-between gap-2">
            <a
              href={techniqueIdWebSearchUrl(id)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900"
            >
              {techniqueLabel(id)}
            </a>
            <span className="tabular-nums text-zinc-600">{count} 回</span>
          </li>
        ))}
        <li className="mt-1 flex items-center justify-between gap-2 border-t border-zinc-200 pt-1">
          <span>手動操作</span>
          <span className="tabular-nums text-zinc-600">{manualSteps} 手</span>
        </li>
      </ul>
    </div>
  );
}

export function PlayResultPanel({
  won,
  level,
  mistakes,
  techniqueUsage,
  onRequestNewPuzzle,
  onStartReplay,
}: {
  won: boolean;
  level: number;
  mistakes: number;
  techniqueUsage: {
    byTechnique: ReadonlyMap<TechniqueId, number>;
    manualSteps: number;
  };
  onRequestNewPuzzle: () => void;
  onStartReplay: () => void;
}) {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">
        {won ? "クリア！" : "残念…"}
      </h1>
      <p className="mt-4 text-zinc-600">
        {won
          ? "すべてのマスが正解です。"
          : "マスはすべて埋まりましたが、どこかが正解と異なります。"}
      </p>
      <p className="mt-1 text-sm tabular-nums text-zinc-600">
        Level: {level}
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        間違えた入力の回数（目安）:{" "}
        <span className="font-medium text-zinc-800">{mistakes}</span>
      </p>
      <TechniqueUsageList
        byTechnique={techniqueUsage.byTechnique}
        manualSteps={techniqueUsage.manualSteps}
      />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {won ? (
          <button
            type="button"
            onClick={onStartReplay}
            className="inline-flex justify-center rounded-lg border border-amber-600 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100"
          >
            振り返る
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRequestNewPuzzle}
          className="inline-flex justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          別の問題（ランダム）
        </button>
        <Link
          href="/"
          className="inline-flex justify-center rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          トップへ
        </Link>
      </div>
    </main>
  );
}
