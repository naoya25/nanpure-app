"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";

import { SudokuPlayClient } from "@/components/nanpure/SudokuPlayClient";
import { usePuzzleSession } from "@/components/nanpure/usePuzzleSession";
import { loadDifficultyPercent } from "@/lib/services/difficulty_settings";

const PAGE_TITLE = "プレイ(問題を選ぶ) | ナンプレトレーニング";

function PreparingScreen() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-24 text-center">
      <p className="animate-pulse text-sm font-medium text-zinc-500">
        問題を準備しています…
      </p>
    </main>
  );
}

function PlayErrorScreen({
  kind,
  onRetry,
}: {
  kind: "invalid_shared_puzzle" | "generation_failed";
  onRetry: () => void;
}) {
  const isInvalidSharedPuzzle = kind === "invalid_shared_puzzle";
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
      <h1 className="text-xl font-semibold text-zinc-900">
        {isInvalidSharedPuzzle ? "不正な共有 URL です" : "問題を読み込めませんでした"}
      </h1>
      <p className="text-zinc-600">
        {isInvalidSharedPuzzle
          ? "この URL の問題は開けませんでした。"
          : "問題の生成に失敗しました。しばらくしてからもう一度お試しください。"}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          もう一度試す
        </button>
        <Link
          href={`/play/?d=${loadDifficultyPercent()}`}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          ランダムな問題で始める
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

function PlayPageInner() {
  const { state, retry } = usePuzzleSession();

  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  if (state.status === "error") {
    return <PlayErrorScreen kind={state.kind} onRetry={retry} />;
  }

  if (state.status !== "ready") {
    return <PreparingScreen />;
  }

  return <SudokuPlayClient key={state.puzzle.puzzle_81} puzzle={state.puzzle} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<PreparingScreen />}>
      <PlayPageInner />
    </Suspense>
  );
}
