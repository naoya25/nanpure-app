import Link from "next/link";

import { loadRandomPuzzleForPlay } from "@/lib/services/load_random_puzzle_for_play";
import { createClient } from "@/lib/supabase/server";
import { linesOf81 } from "@/lib/utils/grid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "プレイ | nanpure-app",
};

export default async function PlayPage() {
  const supabase = await createClient();
  const result = await loadRandomPuzzleForPlay(supabase);

  if (result.outcome === "retry") {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-900">
          問題を読み込めませんでした
        </h1>
        <p className="text-zinc-600">{result.userMessage}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/play"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            もう一度試す
          </Link>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            トップへ
          </Link>
        </div>
      </main>
    );
  }

  if (result.outcome === "no_data") {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-900">
          問題がありません
        </h1>
        <p className="text-zinc-600">
          データベースにナンプレがまだ登録されていません。
        </p>
        <Link href="/" className="text-sm font-medium text-zinc-900 underline">
          トップへ
        </Link>
      </main>
    );
  }

  const { puzzle } = result;
  const puzzleLines = linesOf81(puzzle.puzzle_81);
  const solutionLines = linesOf81(puzzle.solution_81);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900">
          プレイ（仮表示）
        </h1>
        <Link
          href="/"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          トップへ
        </Link>
      </div>

      <dl className="mb-8 grid gap-2 text-sm text-zinc-700">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 font-medium text-zinc-500">id</dt>
          <dd className="font-mono text-xs break-all">{puzzle.id}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 font-medium text-zinc-500">
            difficulty_id
          </dt>
          <dd>{puzzle.difficulty_id}</dd>
        </div>
        {puzzle.description ? (
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-medium text-zinc-500">
              description
            </dt>
            <dd>{puzzle.description}</dd>
          </div>
        ) : null}
      </dl>

      <section className="mb-10">
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          puzzle_81（初期盤・0 は空）
        </h2>
        <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-6 text-zinc-900">
          {puzzleLines.join("\n")}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          solution_81（正解・開発用にそのまま表示）
        </h2>
        <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-6 text-zinc-900">
          {solutionLines.join("\n")}
        </pre>
      </section>
    </main>
  );
}
