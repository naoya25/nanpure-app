import Link from "next/link";
import { redirect } from "next/navigation";

import { loadRandomPuzzleForPlay } from "@/lib/services/load_random_puzzle_for_play";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "プレイ（問題を選ぶ） | nanpure-app",
};

/**
 * ランダムに 1 問選び `/play/[id]` へリダイレクトする。
 * 共有 URL・ブックマークは常に `/play/[id]` を指す。
 */
export default async function PlayRandomPage() {
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

  redirect(`/play/${result.puzzle.id}`);
}
