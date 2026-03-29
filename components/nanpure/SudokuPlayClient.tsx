"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { parsePuzzle81 } from "@/lib/validates/grid";
import {
  isBoardComplete,
  isBoardMatchingSolution,
  isDigitCorrectForSolution,
} from "@/lib/validates/validate";

export type SudokuPlayPuzzle = {
  id: string;
  puzzle_81: string;
  solution_81: string;
  description: string | null;
  difficulty_id: number;
};

function emptyWrongFlags(): boolean[] {
  return Array.from({ length: 81 }, () => false);
}

function cellBorderClasses(index: number): string {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const parts: string[] = [];
  if (col < 8) {
    parts.push(
      col % 3 === 2
        ? "border-r-2 border-r-zinc-600"
        : "border-r border-r-zinc-300",
    );
  }
  if (row < 8) {
    parts.push(
      row % 3 === 2
        ? "border-b-2 border-b-zinc-600"
        : "border-b border-b-zinc-300",
    );
  }
  return parts.join(" ");
}

export function SudokuPlayClient({ puzzle }: { puzzle: SudokuPlayPuzzle }) {
  const { values: seedValues, fixed } = useMemo(
    () => parsePuzzle81(puzzle.puzzle_81),
    [puzzle.puzzle_81],
  );

  const [grid, setGrid] = useState<number[]>(() => [...seedValues]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [wrongHighlight, setWrongHighlight] =
    useState<boolean[]>(emptyWrongFlags);
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [won, setWon] = useState<boolean | null>(null);

  const applyDigit = useCallback(
    (digit: number) => {
      if (phase !== "playing") return;
      if (selectedIndex === null || fixed[selectedIndex]) return;
      const i = selectedIndex;
      const next = [...grid];
      next[i] = digit;
      const correct = isDigitCorrectForSolution(digit, puzzle.solution_81, i);

      setGrid(next);
      setWrongHighlight((wh) => {
        const n = [...wh];
        n[i] = !correct;
        return n;
      });
      if (!correct) {
        setMistakes((m) => m + 1);
      }

      if (isBoardComplete(next)) {
        setPhase("result");
        setWon(isBoardMatchingSolution(next, puzzle.solution_81));
      }
    },
    [phase, selectedIndex, fixed, grid, puzzle.solution_81],
  );

  const clearCell = useCallback(() => {
    if (phase !== "playing") return;
    if (selectedIndex === null || fixed[selectedIndex]) return;
    const i = selectedIndex;
    const next = [...grid];
    next[i] = 0;
    setGrid(next);
    setWrongHighlight((wh) => {
      const n = [...wh];
      n[i] = false;
      return n;
    });
  }, [phase, selectedIndex, fixed, grid]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        applyDigit(Number(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        clearCell();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, applyDigit, clearCell]);

  if (phase === "result") {
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
        <p className="mt-2 text-sm text-zinc-500">
          間違えた入力の回数（目安）:{" "}
          <span className="font-medium text-zinc-800">{mistakes}</span>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/play"
            className="inline-flex justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            別の問題（ランダム）
          </Link>
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

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">ナンプレ</h1>
          {puzzle.description ? (
            <p className="mt-1 text-sm text-zinc-600">{puzzle.description}</p>
          ) : null}
        </div>
        <div className="text-right text-sm text-zinc-600">
          <p>
            ミス:{" "}
            <span className="font-semibold text-zinc-900">{mistakes}</span>
          </p>
          <div className="mt-2 flex flex-col gap-1">
            <Link
              href="/play"
              className="text-zinc-500 underline hover:text-zinc-800"
            >
              別の問題
            </Link>
            <Link
              href="/"
              className="text-zinc-500 underline hover:text-zinc-800"
            >
              トップ
            </Link>
          </div>
        </div>
      </div>

      <div className="inline-block rounded-lg border-2 border-zinc-700 bg-white p-0.5 shadow-sm">
        <div className="grid grid-cols-9">
          {grid.map((value, i) => {
            const isFixed = fixed[i];
            const selected = selectedIndex === i;
            const wrong = wrongHighlight[i];
            return (
              <button
                key={i}
                type="button"
                disabled={isFixed}
                onClick={() => setSelectedIndex(i)}
                className={[
                  "flex h-9 w-9 items-center justify-center text-base font-medium sm:h-10 sm:w-10 sm:text-lg",
                  cellBorderClasses(i),
                  isFixed
                    ? "cursor-default bg-zinc-100 text-zinc-900"
                    : "cursor-pointer bg-white text-zinc-900 hover:bg-zinc-50",
                  selected
                    ? "relative z-10 ring-2 ring-inset ring-blue-600"
                    : "",
                  wrong ? "bg-red-50 text-red-800" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {value === 0 ? "" : value}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        マスを選んでから 1〜9 を入力（キーボード可）。消すは Delete / ボタン。
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => applyDigit(n)}
            className="h-10 w-10 rounded-md border border-zinc-300 bg-white text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={clearCell}
          className="h-10 min-w-18 rounded-md border border-zinc-300 bg-white px-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          消す
        </button>
      </div>
    </main>
  );
}
