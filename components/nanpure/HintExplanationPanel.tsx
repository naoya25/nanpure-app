import Link from "next/link";

import type { TechniqueExplanation } from "@/lib/types/sudoku_technique_types";

const MAX_CHANGE_LINES = 4;

type HintExplanationPanelProps = {
  techniqueLabel: string;
  explanation: TechniqueExplanation | undefined;
  /** この手で盤がどう変わるか（変更マスごとの文） */
  changes: readonly string[];
  /** 学習ページのこのテクニックへのパス */
  learnHref: string;
  onApply: () => void;
  onBackToList: () => void;
  onClose: () => void;
};

/** ヒントで選んだテクニックが、今の盤面でどこに・なぜ使えるかを見せる */
export function HintExplanationPanel({
  techniqueLabel,
  explanation,
  changes,
  learnHref,
  onApply,
  onBackToList,
  onClose,
}: HintExplanationPanelProps) {
  const shownChanges = changes.slice(0, MAX_CHANGE_LINES);
  const hiddenChangeCount = changes.length - shownChanges.length;

  return (
    <section
      aria-labelledby="hint-explanation-title"
      className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          id="hint-explanation-title"
          className="text-base font-semibold text-zinc-900"
        >
          {techniqueLabel}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          閉じる
        </button>
      </div>

      {explanation ? (
        <p className="mt-2 leading-relaxed text-zinc-800">{explanation.reason}</p>
      ) : null}

      <ul className="mt-2 flex flex-col gap-0.5 text-zinc-700">
        {shownChanges.map((line) => (
          <li key={line} className="tabular-nums">
            → {line}
          </li>
        ))}
        {hiddenChangeCount > 0 ? (
          <li className="text-zinc-500">ほか {hiddenChangeCount} マス</li>
        ) : null}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
        {explanation && explanation.basisCellIndex.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-zinc-300 bg-[var(--cell-bg-basis)]" />
            根拠のマス
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-zinc-300 bg-[var(--cell-bg-technique)]" />
          変わるマス
        </span>
        <Link
          href={learnHref}
          target="_blank"
          className="ml-auto underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900"
        >
          このテクニックについて
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          autoFocus
          onClick={onApply}
          className="min-h-11 touch-manipulation rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 active:bg-zinc-700"
        >
          この手を進める
        </button>
        <button
          type="button"
          onClick={onBackToList}
          className="min-h-11 touch-manipulation rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          ほかのテクニックを見る
        </button>
      </div>
    </section>
  );
}
