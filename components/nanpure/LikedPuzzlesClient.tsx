"use client";

import Link from "next/link";
import { useState } from "react";

import {
  listLikedPuzzles,
  setPuzzleLiked,
  type LikedPuzzle,
} from "@/lib/services/liked_puzzles";

function formatLikedDate(likedAt: number): string {
  const d = new Date(likedAt);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function PuzzleThumbnail({ puzzle81 }: { puzzle81: string }) {
  return (
    <div
      className="grid h-[4.5rem] w-[4.5rem] shrink-0 grid-cols-9 grid-rows-9 border border-[var(--rule-thick)] bg-white text-[7px] leading-none text-zinc-800"
      aria-hidden
    >
      {puzzle81.split("").map((ch, i) => (
        <span
          key={i}
          className={[
            "flex items-center justify-center",
            i % 9 === 2 || i % 9 === 5 ? "border-r border-zinc-400" : "",
            Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5
              ? "border-b border-zinc-400"
              : "",
          ].join(" ")}
        >
          {ch === "0" ? "" : ch}
        </span>
      ))}
    </div>
  );
}

export default function LikedPuzzlesClient() {
  const [puzzles, setPuzzles] = useState<LikedPuzzle[]>(() => listLikedPuzzles());
  const [message, setMessage] = useState<string | null>(null);

  const remove = (puzzle: LikedPuzzle) => {
    if (setPuzzleLiked(puzzle, false) !== "ok") {
      setMessage("いいねを外せませんでした。ブラウザの保存領域を確認してください。");
      return;
    }
    setMessage(null);
    setPuzzles(listLikedPuzzles());
  };

  if (puzzles.length === 0) {
    return (
      <p className="mt-6 text-sm leading-relaxed text-zinc-600">
        まだありません。プレイ中やクリア後に「いいね」を押すと、ここに保存されます。
      </p>
    );
  }

  return (
    <>
      {message ? (
        <p role="status" className="mt-4 text-sm text-rose-700">
          {message}
        </p>
      ) : null}
      <ul className="mt-6 flex flex-col gap-3">
        {puzzles.map((p) => (
          <li
            key={p.puzzle_81}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3"
          >
            <PuzzleThumbnail puzzle81={p.puzzle_81} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tabular-nums text-zinc-900">
                Level {p.level}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
                {formatLikedDate(p.likedAt)} にいいね
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={`/play/?p=${p.puzzle_81}`}
                  className="inline-flex min-h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  解く
                </Link>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  className="inline-flex min-h-10 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  いいねを外す
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
