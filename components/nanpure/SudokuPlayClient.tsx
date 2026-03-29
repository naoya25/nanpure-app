"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SudokuGrid } from "@/lib/nanpure/sudoku_grid";
import { parsePuzzle81 } from "@/lib/validates/grid";
import {
  isBoardComplete,
  isBoardMatchingSolution,
  isDigitCorrectForSolution,
  isEverySolutionCellForDigitFilled,
} from "@/lib/validates/validate";

export type SudokuPlayPuzzle = {
  id: string;
  puzzle_81: string;
  solution_81: string;
  description: string | null;
  level: number;
};

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

type CellHighlight = {
  selected: boolean;
  /** 選択中マスに 1〜9 が入っているとき、同じ数字のマス */
  digitMatch: boolean;
  /** 選択マスと同じ行・列・3×3 ブロック */
  inBand: boolean;
};

function cellHighlights(
  index: number,
  selectedIndex: number | null,
  grid: readonly number[],
): CellHighlight {
  if (selectedIndex === null) {
    return { selected: false, digitMatch: false, inBand: false };
  }
  const sr = Math.floor(selectedIndex / 9);
  const sc = selectedIndex % 9;
  const ri = Math.floor(index / 9);
  const ci = index % 9;
  const selected = index === selectedIndex;
  const inBand =
    ri === sr ||
    ci === sc ||
    (Math.floor(ri / 3) === Math.floor(sr / 3) &&
      Math.floor(ci / 3) === Math.floor(sc / 3));
  const sv = grid[selectedIndex];
  const digitMatch = sv >= 1 && sv <= 9 && grid[index] === sv && !selected;
  const inBandOnly = inBand && !selected;
  return {
    selected,
    digitMatch,
    inBand: inBandOnly,
  };
}

function memoMaskHas(mask: number, digit: number): boolean {
  if (digit < 1 || digit > 9) return false;
  return (mask & (1 << (digit - 1))) !== 0;
}

/**
 * 数字行・テンキーの 1〜9。Shift で `e.key` が記号でも `code` の `Digit*` / `Numpad*` で拾う。
 */
function digitFromKeyboardEvent(e: KeyboardEvent): number | null {
  const row = /^Digit([1-9])$/.exec(e.code);
  if (row) return Number(row[1]);
  const pad = /^Numpad([1-9])$/.exec(e.code);
  if (pad) return Number(pad[1]);
  if (e.key >= "1" && e.key <= "9") return Number(e.key);
  return null;
}

function CellMemoMarks({ mask }: { mask: number }) {
  return (
    <span className="pointer-events-none flex h-full min-h-0 w-full items-center justify-center px-0.5 py-0.5">
      <span className="grid aspect-square h-full w-full max-h-full max-w-full grid-cols-3 grid-rows-3 place-items-center text-[0.58rem] font-semibold leading-none text-zinc-700 sm:text-[0.68rem]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span
            key={d}
            className={
              memoMaskHas(mask, d) ? "tabular-nums" : "invisible tabular-nums"
            }
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function cellSurfaceClasses(readOnly: boolean, h: CellHighlight): string {
  if (h.selected) {
    return "relative z-10 bg-sky-200 ring-2 ring-inset ring-blue-600";
  }
  if (h.digitMatch) {
    return readOnly
      ? "bg-sky-200 text-zinc-900"
      : "bg-sky-100 text-zinc-900 hover:bg-sky-200";
  }
  if (h.inBand) {
    return readOnly
      ? "bg-sky-100 text-zinc-900"
      : "bg-sky-50 text-zinc-900 hover:bg-sky-100";
  }
  return readOnly
    ? "cursor-default bg-zinc-100 text-zinc-900"
    : "cursor-pointer bg-white text-zinc-900 hover:bg-zinc-50";
}

export function SudokuPlayClient({ puzzle }: { puzzle: SudokuPlayPuzzle }) {
  const { values: seedValues, fixed } = useMemo(
    () => parsePuzzle81(puzzle.puzzle_81),
    [puzzle.puzzle_81],
  );

  const [board, setBoard] = useState(() => SudokuGrid.fromValues(seedValues));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [inputWarning, setInputWarning] = useState<string | null>(null);
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [won, setWon] = useState<boolean | null>(null);

  const gridValues = useMemo(() => [...board.values()], [board]);

  /** ヒントマス、またはユーザーが入れた数字がそのマスの正解と一致しているマスは編集不可 */
  const cellReadOnly = useMemo(
    () =>
      gridValues.map((v, i) => {
        if (fixed[i]) return true;
        return v >= 1 && v <= 9 && String(v) === puzzle.solution_81[i];
      }),
    [gridValues, fixed, puzzle.solution_81],
  );

  const digitComplete = useMemo(() => {
    const sol = puzzle.solution_81;
    return [
      false,
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) =>
        isEverySolutionCellForDigitFilled(d, gridValues, sol),
      ),
    ] as const;
  }, [gridValues, puzzle.solution_81]);

  const applyDigit = useCallback(
    (digit: number) => {
      if (phase !== "playing") return;
      if (digitComplete[digit]) return;
      if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
      const i = selectedIndex;
      const correct = isDigitCorrectForSolution(digit, puzzle.solution_81, i);

      if (!correct) {
        setBoard((b) => b.clearValueKeepMemo(i));
        setMistakes((m) => m + 1);
        setInputWarning(
          `「${digit}」はこのマスでは正しくありません。別の数字を試してください。`,
        );
        return;
      }

      const next = board.placeDigit(i, digit);
      setBoard(next);
      setInputWarning(null);

      const values = [...next.values()];
      if (isBoardComplete(values)) {
        setPhase("result");
        setWon(isBoardMatchingSolution(values, puzzle.solution_81));
      }
    },
    [
      phase,
      digitComplete,
      selectedIndex,
      cellReadOnly,
      board,
      puzzle.solution_81,
    ],
  );

  const clearCell = useCallback(() => {
    if (phase !== "playing") return;
    if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
    const i = selectedIndex;
    setBoard((b) => b.clearCell(i));
    setInputWarning(null);
  }, [phase, selectedIndex, cellReadOnly]);

  const toggleMemoAtSelection = useCallback(
    (digit: number) => {
      if (phase !== "playing") return;
      if (digit < 1 || digit > 9) return;
      if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
      const i = selectedIndex;
      if (board.cellAt(i).value !== 0) return;
      setBoard((b) => b.toggleMemo(i, digit));
    },
    [phase, selectedIndex, cellReadOnly, board],
  );

  useEffect(() => {
    if (inputWarning === null) return;
    const id = window.setTimeout(() => setInputWarning(null), 1000);
    return () => window.clearTimeout(id);
  }, [inputWarning]);

  useEffect(() => {
    if (phase !== "playing") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const digit = digitFromKeyboardEvent(e);
      if (digit !== null) {
        e.preventDefault();
        if (e.shiftKey) toggleMemoAtSelection(digit);
        else applyDigit(digit);
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        clearCell();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, applyDigit, clearCell, toggleMemoAtSelection]);

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
      {inputWarning ? (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-[max(1rem,env(safe-area-inset-top,0px))] left-1/2 z-50 w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-lg"
        >
          {inputWarning}
        </div>
      ) : null}

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
          {gridValues.map((value, i) => {
            const readOnly = cellReadOnly[i];
            const h = cellHighlights(i, selectedIndex, gridValues);
            const mask = board.cellAt(i).memoMask;
            const showMemo = value === 0 && mask !== 0;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                aria-current={h.selected ? "true" : undefined}
                className={[
                  "flex h-9 w-9 font-medium sm:h-10 sm:w-10",
                  showMemo
                    ? "items-stretch p-0"
                    : "items-center justify-center p-0",
                  !showMemo && value !== 0 ? "text-base sm:text-lg" : "",
                  cellBorderClasses(i),
                  cellSurfaceClasses(readOnly, h),
                ].join(" ")}
              >
                {showMemo ? (
                  <CellMemoMarks mask={mask} />
                ) : value === 0 ? (
                  ""
                ) : (
                  value
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const done = digitComplete[n];
            return (
              <button
                key={n}
                type="button"
                disabled={done}
                onClick={() => applyDigit(n)}
                className={[
                  "h-10 w-10 rounded-md border text-sm font-medium",
                  done
                    ? "pointer-events-none cursor-default border-transparent bg-transparent text-transparent opacity-0"
                    : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
                ].join(" ")}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-500">メモ</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleMemoAtSelection(n)}
                className="h-10 w-10 rounded-md border border-amber-300 bg-amber-50/80 text-sm font-medium text-amber-950 hover:bg-amber-100"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
