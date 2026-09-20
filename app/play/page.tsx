"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { SudokuPlayClient } from "@/components/nanpure/SudokuPlayClient";
import { preparePuzzleForPlay } from "@/lib/services/prepare_puzzle_for_play";
import { PUZZLE_STOCK_TARGET_SIZE, push, stockCount } from "@/lib/storage/puzzle_stock";
import type { Puzzle } from "@/lib/types/puzzle";
import { requestGeneratedPuzzle } from "@/lib/workers/generate_puzzle_client";

const PAGE_TITLE = "プレイ(問題を選ぶ) | ナンプレトレーニング";

type PlayPageState =
  | { status: "loading" }
  | { status: "error"; kind: "invalid_shared_puzzle" | "generation_failed" }
  | ({ status: "ready" } & Puzzle);

function readSharedPuzzleFromLocation(): string | null {
  return new URLSearchParams(window.location.search).get("p");
}

function replaceSharedPuzzleInUrl(puzzle81: string | null): void {
  const url = new URL(window.location.href);
  if (puzzle81) {
    url.searchParams.set("p", puzzle81);
  } else {
    url.searchParams.delete("p");
  }
  window.history.replaceState(null, "", url);
}

function replenishStockInBackground(): void {
  void (async () => {
    while (stockCount() < PUZZLE_STOCK_TARGET_SIZE) {
      try {
        push(await requestGeneratedPuzzle());
      } catch {
        return;
      }
    }
  })();
}

export default function PlayPage() {
  const [state, setState] = useState<PlayPageState>({ status: "loading" });
  const startedRef = useRef(false);

  const start = useCallback((sharedPuzzle81: string | null) => {
    void (async () => {
      const result = await preparePuzzleForPlay(sharedPuzzle81);
      if (result.outcome !== "ok") {
        setState({ status: "error", kind: result.outcome });
        return;
      }
      replaceSharedPuzzleInUrl(result.puzzle.puzzle_81);
      setState({ status: "ready", ...result.puzzle });
      replenishStockInBackground();
    })();
  }, []);

  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start(readSharedPuzzleFromLocation());
  }, [start]);

  const retryWithRandomPuzzle = useCallback(() => {
    setState({ status: "loading" });
    replaceSharedPuzzleInUrl(null);
    start(null);
  }, [start]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-24 text-center">
        <p className="animate-pulse text-sm font-medium text-zinc-500">
          問題を準備しています…
        </p>
      </main>
    );
  }

  if (state.status === "error") {
    const isInvalidSharedPuzzle = state.kind === "invalid_shared_puzzle";
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
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retryWithRandomPuzzle}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            ランダムな問題で始める
          </button>
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

  return (
    <SudokuPlayClient
      key={state.puzzle_81}
      onRequestNewPuzzle={retryWithRandomPuzzle}
      puzzle={{
        puzzle_81: state.puzzle_81,
        solution_81: state.solution_81,
        level: state.level,
      }}
    />
  );
}
