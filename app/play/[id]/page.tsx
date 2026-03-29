import Link from "next/link";

import { SudokuPlayClient } from "@/components/nanpure/SudokuPlayClient";
import { loadPuzzleForPlay } from "@/lib/services/load_puzzle_for_play";
import {
  createClient,
  supabaseServerConfigErrorMessage,
} from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `プレイ ${id.slice(0, 8)}… | nanpure-app`,
  };
}

export default async function PlayByIdPage({ params }: Props) {
  const configError = supabaseServerConfigErrorMessage();
  if (configError) {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-900">設定を確認してください</h1>
        <p className="text-zinc-600">{configError}</p>
        <Link href="/" className="text-sm font-medium text-zinc-900 underline">
          トップへ
        </Link>
      </main>
    );
  }

  const { id } = await params;
  const supabase = await createClient();
  const result = await loadPuzzleForPlay(supabase, id);

  if (result.outcome === "retry") {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-900">
          問題を読み込めませんでした
        </h1>
        <p className="text-zinc-600">{result.userMessage}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/play/${id}`}
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

  if (result.outcome === "invalid_id") {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-900">無効な問題 ID です</h1>
        <p className="text-zinc-600">URL の形式が正しくありません。</p>
        <Link href="/play" className="text-sm font-medium text-zinc-900 underline">
          ランダムでプレイする
        </Link>
      </main>
    );
  }

  if (result.outcome === "not_found") {
    return (
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-900">問題が見つかりません</h1>
        <p className="text-zinc-600">
          指定された ID の問題は存在しないか、削除された可能性があります。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/play"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            別の問題をランダムで選ぶ
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

  const { puzzle } = result;

  return (
    <SudokuPlayClient
      key={puzzle.id}
      puzzle={{
        id: puzzle.id,
        puzzle_81: puzzle.puzzle_81,
        solution_81: puzzle.solution_81,
        description: puzzle.description,
        level: puzzle.level,
      }}
    />
  );
}
