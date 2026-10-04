import Link from "next/link";

import { TECHNIQUE_LABEL_BY_ID } from "@/lib/types/sudoku_technique_types";
import {
  TECHNIQUE_LEARNING_PUZZLE_COUNT,
  TECHNIQUE_LEARNING_STEPS,
  TECHNIQUE_SUMMARY_BY_ID,
  type TechniqueLearningStep,
} from "@/lib/types/technique_learning";
import { techniqueIdWebSearchUrl } from "@/lib/utils/technique_web_search";

export const metadata = {
  title: "テクニックを学ぶ | ナンプレトレーニング",
};

function percent(count: number): string {
  return ((count / TECHNIQUE_LEARNING_PUZZLE_COUNT) * 100).toFixed(1);
}

function TechniqueCard({
  step,
  order,
  gainedPuzzleCount,
}: {
  step: TechniqueLearningStep;
  order: number;
  gainedPuzzleCount: number;
}) {
  const solvable = percent(step.solvablePuzzleCount);
  return (
    <li
      id={step.id}
      className="scroll-mt-4 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-sm tabular-nums text-zinc-400">{order}</span>
        <h3 className="text-base font-semibold text-zinc-900">
          {TECHNIQUE_LABEL_BY_ID[step.id]}
        </h3>
        <span className="ml-auto shrink-0 text-xs tabular-nums text-zinc-500">
          使う問題 {percent(step.usedPuzzleCount)}%
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        {TECHNIQUE_SUMMARY_BY_ID[step.id]}
      </p>
      <div className="mt-3">
        <div
          className="h-2 overflow-hidden rounded-full bg-zinc-100"
          role="img"
          aria-label={`ここまで覚えると ${solvable}% の問題が解ける`}
        >
          <div
            className="h-full rounded-full bg-[var(--ring-selected)]"
            style={{ width: `${solvable}%` }}
          />
        </div>
        <p className="mt-1.5 flex items-baseline gap-2 text-sm text-zinc-700">
          <span>
            ここまで覚えると{" "}
            <strong className="font-semibold tabular-nums text-zinc-900">
              {solvable}%
            </strong>{" "}
            の問題が解ける
          </span>
          {gainedPuzzleCount > 0 ? (
            <span className="text-xs tabular-nums text-zinc-500">
              +{percent(gainedPuzzleCount)}
            </span>
          ) : null}
          <a
            href={techniqueIdWebSearchUrl(step.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-800"
          >
            Web で調べる
          </a>
        </p>
      </div>
    </li>
  );
}

export default function LearnPage() {
  const used = TECHNIQUE_LEARNING_STEPS.filter((s) => s.usedPuzzleCount > 0);
  const unused = TECHNIQUE_LEARNING_STEPS.filter((s) => s.usedPuzzleCount === 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900">テクニックを学ぶ</h1>
        <Link href="/" className="text-sm text-zinc-500 underline hover:text-zinc-800">
          トップ
        </Link>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        上から順に覚えると、解ける問題がいちばん速く増える並びです。いちばん難しい設定（難易度
        100%）の問題 {TECHNIQUE_LEARNING_PUZZLE_COUNT} 問を解いて集計しました。
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        プレイ中にヒントを押すと、その盤面で使えるテクニックと、どこに・なぜ使えるかを確かめられます。
      </p>

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-base font-semibold text-zinc-900">マスの呼び方</h2>
        <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3">
          <ul className="flex min-w-0 flex-1 basis-56 flex-col gap-1.5 text-sm leading-relaxed text-zinc-700">
            <li>
              行は上から <strong className="font-semibold text-zinc-900">A〜I</strong>
              、列は左から{" "}
              <strong className="font-semibold text-zinc-900">1〜9</strong>{" "}
              です。盤の左と上に書いてあります。
            </li>
            <li>
              マスは行と列を並べて呼びます。2 行目・3 列目のマスは{" "}
              <strong className="font-semibold text-zinc-900">B3</strong> です。
            </li>
            <li>
              太線で囲まれた 3×3 のブロックは、左上から右へ、上から下へ{" "}
              <strong className="font-semibold text-zinc-900">ブロック1〜9</strong>{" "}
              です（右の図）。
            </li>
          </ul>
          <div
            className="grid shrink-0 grid-cols-3 overflow-hidden rounded-md border-2 border-[var(--rule-thick)]"
            role="img"
            aria-label="ブロックの番号。上の段が左から 1・2・3、中の段が 4・5・6、下の段が 7・8・9"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span
                key={n}
                className="flex h-10 w-10 items-center justify-center border border-[var(--rule-thin)] text-sm font-semibold tabular-nums text-zinc-700"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      <ol className="mt-6 flex flex-col gap-3">
        {used.map((step, i) => (
          <TechniqueCard
            key={step.id}
            step={step}
            order={i + 1}
            gainedPuzzleCount={
              step.solvablePuzzleCount - (used[i - 1]?.solvablePuzzleCount ?? 0)
            }
          />
        ))}
      </ol>

      {unused.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-zinc-900">
            今回の {TECHNIQUE_LEARNING_PUZZLE_COUNT} 問では出番が無かったテクニック
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {unused.map((step) => (
              <li
                key={step.id}
                id={step.id}
                className="scroll-mt-4 rounded-lg border border-zinc-200 bg-white p-4"
              >
                <h3 className="text-sm font-semibold text-zinc-900">
                  {TECHNIQUE_LABEL_BY_ID[step.id]}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                  {TECHNIQUE_SUMMARY_BY_ID[step.id]}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
