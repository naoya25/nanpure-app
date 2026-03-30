"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ClearSelectionIcon } from "@/components/icons/clear-selection-icon";
import { RedoIcon } from "@/components/icons/redo-icon";
import { UndoIcon } from "@/components/icons/undo-icon";
import { PlayHistory } from "@/lib/models/play_history";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import {
  TECHNIQUE_BUTTONS,
  runTechniqueStep,
} from "@/lib/models/sudoku_technique_runner";
import { parsePuzzle81 } from "@/lib/validates/grid";
import type { TechniqueId } from "@/lib/types/sudoku_technique_types";
import {
  isBoardComplete,
  isBoardMatchingSolution,
  isCellMismatchingSolution,
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

function CellMemoMarks({
  mask,
  highlightDigit,
}: {
  mask: number;
  /** 選択中マスに 1〜9 があるとき、その数字に一致するメモ桁を太字にする */
  highlightDigit: number | null;
}) {
  return (
    <span className="pointer-events-none flex h-full min-h-0 w-full items-center justify-center px-0.5 py-0.5">
      <span className="grid aspect-square h-full w-full max-h-full max-w-full grid-cols-3 grid-rows-3 place-items-center text-[0.58rem] leading-none sm:text-[0.68rem]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const visible = memoMaskHas(mask, d);
          const digitHighlight =
            visible && highlightDigit !== null && d === highlightDigit;
          return (
            <span
              key={d}
              className={
                visible
                  ? digitHighlight
                    ? "font-extrabold tabular-nums text-zinc-900"
                    : "font-medium tabular-nums text-zinc-400"
                  : "invisible tabular-nums"
              }
            >
              {d}
            </span>
          );
        })}
      </span>
    </span>
  );
}

function cellSurfaceClasses(
  readOnly: boolean,
  h: CellHighlight,
  incorrect: boolean,
): string {
  if (h.selected) {
    return incorrect
      ? "relative z-10 bg-red-200 ring-2 ring-inset ring-blue-600"
      : "relative z-10 bg-sky-200 ring-2 ring-inset ring-blue-600";
  }
  if (incorrect) {
    return readOnly
      ? "bg-red-100 text-red-900"
      : "bg-red-100 text-red-900 hover:bg-red-200";
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
    ? "bg-zinc-100 text-zinc-900"
    : "bg-white text-zinc-900 hover:bg-zinc-50";
}

export function SudokuPlayClient({ puzzle }: { puzzle: SudokuPlayPuzzle }) {
  const { values: seedValues, fixed } = useMemo(
    () => parsePuzzle81(puzzle.puzzle_81),
    [puzzle.puzzle_81],
  );

  const [history, setHistory] = useState(() =>
    PlayHistory.create(SudokuGrid.fromValues(seedValues)),
  );
  const historyRef = useRef(history);
  const board = history.present;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<"playing" | "result">("playing");
  const [won, setWon] = useState<boolean | null>(null);
  const [showTechniqueList, setShowTechniqueList] = useState(false);

  const techniqueButtons = TECHNIQUE_BUTTONS;

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const gridValues = useMemo(() => [...board.values()], [board]);

  /** 選択マスに確定数字があるとき、盤上のメモで同じ数字を強調する */
  const memoHighlightDigit = useMemo(() => {
    if (selectedIndex === null) return null;
    const v = gridValues[selectedIndex];
    return v >= 1 && v <= 9 ? v : null;
  }, [selectedIndex, gridValues]);

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
      const h = historyRef.current;
      const { next, matchesSolution } = h.present.placeDigit(
        i,
        digit,
        puzzle.solution_81,
      );
      const nh = h.recordNext(next);
      setHistory(nh);

      if (!matchesSolution) {
        setMistakes((m) => m + 1);
        return;
      }

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
      puzzle.solution_81,
    ],
  );

  const applyTechnique = useCallback(
    (techniqueId: TechniqueId) => {
      if (phase !== "playing") return;

      const h = historyRef.current;
      const grid = h.present;

      const result = runTechniqueStep(grid, techniqueId);

      if (!result) return;

      const next = result.grid;
      const nh = h.recordNext(next);
      setHistory(nh);

      const nextValues = next.values();
      const uniqueChangedCells = Array.from(new Set(result.cellIndex));
      const mismatchCount = uniqueChangedCells.reduce((acc, idx) => {
        const expected = Number(puzzle.solution_81[idx] ?? 0);
        return acc + (nextValues[idx] === expected ? 0 : 1);
      }, 0);
      if (mismatchCount > 0) {
        setMistakes((m) => m + mismatchCount);
      }

      if (isBoardComplete(nextValues)) {
        setPhase("result");
        setWon(isBoardMatchingSolution(nextValues, puzzle.solution_81));
      }

      // 適用できた場合だけ一覧を閉じる（適用なしなら次を選べるように）
      setShowTechniqueList(false);
    },
    [phase, puzzle.solution_81],
  );

  const clearCell = useCallback(() => {
    if (phase !== "playing") return;
    if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
    const i = selectedIndex;
    const h = historyRef.current;
    const nh = h.recordNext(h.present.clearCell(i));
    setHistory(nh);
  }, [phase, selectedIndex, cellReadOnly]);

  const toggleMemoAtSelection = useCallback(
    (digit: number) => {
      if (phase !== "playing") return;
      if (digit < 1 || digit > 9) return;
      if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
      const i = selectedIndex;
      const h = historyRef.current;
      if (h.present.cellAt(i).value !== 0) return;
      const nh = h.recordNext(h.present.toggleMemo(i, digit));
      setHistory(nh);
    },
    [phase, selectedIndex, cellReadOnly],
  );

  const undo = useCallback(() => {
    if (phase !== "playing") return;
    const h = historyRef.current;
    const nh = h.undo();
    setHistory(nh);
  }, [phase]);

  const redo = useCallback(() => {
    if (phase !== "playing") return;
    const h = historyRef.current;
    const nh = h.redo();
    setHistory(nh);
  }, [phase]);

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
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowTechniqueList((v) => !v)}
              aria-expanded={showTechniqueList ? "true" : undefined}
              disabled={phase !== "playing"}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
            >
              実行
            </button>
          </div>
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

      {showTechniqueList ? (
        <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-900">
              テクニック一覧
            </p>
            <button
              type="button"
              onClick={() => setShowTechniqueList(false)}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            >
              閉じる
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {techniqueButtons.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTechnique(t.id)}
                className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200 disabled:pointer-events-none disabled:opacity-40"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="play-surface-cursor">
        <div className="inline-block rounded-lg border-2 border-zinc-700 bg-white p-0.5 shadow-sm">
          <div className="grid grid-cols-9">
            {gridValues.map((value, i) => {
              const readOnly = cellReadOnly[i];
              const h = cellHighlights(i, selectedIndex, gridValues);
              const incorrect = isCellMismatchingSolution(
                i,
                gridValues,
                puzzle.solution_81,
                fixed,
              );
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
                    !showMemo && value !== 0
                      ? "text-xl leading-none sm:text-2xl sm:leading-none"
                      : "",
                    cellBorderClasses(i),
                    cellSurfaceClasses(readOnly, h, incorrect),
                  ].join(" ")}
                >
                  {showMemo ? (
                    <CellMemoMarks
                      mask={mask}
                      highlightDigit={memoHighlightDigit}
                    />
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
          <div className="flex w-full max-w-full flex-nowrap items-stretch gap-0.5 sm:gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
              const done = digitComplete[n];
              return (
                <button
                  key={n}
                  type="button"
                  disabled={done}
                  onClick={() => applyDigit(n)}
                  className={[
                    "flex min-h-11 min-w-0 flex-1 basis-0 touch-manipulation items-center justify-center rounded-md text-lg font-semibold sm:min-h-12 sm:text-xl",
                    done
                      ? "pointer-events-none invisible"
                      : "text-zinc-900 active:bg-zinc-100 sm:hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="flex w-full max-w-full flex-nowrap items-stretch gap-0.5 sm:gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleMemoAtSelection(n)}
                className="flex min-h-11 min-w-0 flex-1 basis-0 touch-manipulation items-center justify-center rounded-md text-lg font-semibold text-zinc-500 active:bg-zinc-100 sm:min-h-12 sm:text-xl sm:hover:bg-zinc-50"
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={phase !== "playing" || !history.canUndo}
              onClick={() => undo()}
              title="一手戻る"
              aria-label="一手戻る"
              className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
            >
              <UndoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              disabled={
                selectedIndex === null ||
                cellReadOnly[selectedIndex] ||
                phase !== "playing"
              }
              onClick={() => clearCell()}
              title="選択中のマスの数字とメモを消す（Backspace でも可）"
              aria-label="選択中のマスの数字とメモを消す"
              className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
            >
              <ClearSelectionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              disabled={phase !== "playing" || !history.canRedo}
              onClick={() => redo()}
              title="一手進める"
              aria-label="一手進める"
              className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
            >
              <RedoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
