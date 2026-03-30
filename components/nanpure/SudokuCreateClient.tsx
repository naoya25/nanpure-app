"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SudokuBoard } from "@/components/nanpure/SudokuBoard";
import { SudokuGrid } from "@/lib/models/sudoku_grid";

function digitFromKeyboardEvent(e: KeyboardEvent): number | null {
  const row = /^Digit([1-9])$/.exec(e.code);
  if (row) return Number(row[1]);
  const pad = /^Numpad([1-9])$/.exec(e.code);
  if (pad) return Number(pad[1]);
  if (e.key >= "1" && e.key <= "9") return Number(e.key);
  return null;
}

const EMPTY_VALUES = Array<number>(81).fill(0);

export function SudokuCreateClient() {
  const [board, setBoard] = useState(() => SudokuGrid.fromValues(EMPTY_VALUES));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [memoMode, setMemoMode] = useState(false);

  const gridValues = useMemo(() => [...board.values()], [board]);
  const fixed = useMemo(() => Array<boolean>(81).fill(false), []);
  const cellReadOnly = useMemo(() => Array<boolean>(81).fill(false), []);

  const memoHighlightDigit = useMemo(() => {
    if (selectedIndex === null) return null;
    const v = gridValues[selectedIndex];
    return v >= 1 && v <= 9 ? v : null;
  }, [selectedIndex, gridValues]);

  const values81 = useMemo(() => gridValues.join(""), [gridValues]);
  const candidateMasks81Array = useMemo(
    () => Array.from({ length: 81 }, (_, i) => board.cellAt(i).memoMask),
    [board],
  );
  const candidateMasks81 = useMemo(
    () => candidateMasks81Array.join(","),
    [candidateMasks81Array],
  );

  const applyDigit = useCallback(
    (digit: number) => {
      if (selectedIndex === null) return;
      if (memoMode) {
        setBoard((prev) => prev.toggleMemo(selectedIndex, digit));
        return;
      }
      setBoard((prev) => prev.placeDigit(selectedIndex, digit).next);
    },
    [selectedIndex, memoMode],
  );

  const toggleMemoAtSelection = useCallback(
    (digit: number) => {
      if (selectedIndex === null) return;
      setBoard((prev) => prev.toggleMemo(selectedIndex, digit));
    },
    [selectedIndex],
  );

  const clearSelection = useCallback(() => {
    if (selectedIndex === null) return;
    setBoard((prev) => prev.clearCell(selectedIndex));
  }, [selectedIndex]);

  const clearAll = useCallback(() => {
    setBoard(SudokuGrid.fromValues(EMPTY_VALUES));
    setSelectedIndex(null);
  }, []);

  useEffect(() => {
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
        clearSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyDigit, clearSelection, toggleMemoAtSelection]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">盤面作成</h1>
          <p className="mt-1 text-sm text-zinc-600">
            空盤面に数字・メモを入力して、81形式を確認できます。
          </p>
        </div>
        <Link href="/" className="text-sm text-zinc-500 underline hover:text-zinc-800">
          トップ
        </Link>
      </div>

      <div className="play-surface-cursor">
        <SudokuBoard
          gridValues={gridValues}
          fixed={fixed}
          cellReadOnly={cellReadOnly}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          board={board}
          memoHighlightDigit={memoHighlightDigit}
          techniqueHighlightedCells={null}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMemoMode((v) => !v)}
            className={[
              "rounded-md border px-3 py-1.5 text-sm font-medium",
              memoMode
                ? "border-sky-600 bg-sky-100 text-sky-900"
                : "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100",
            ].join(" ")}
          >
            {memoMode ? "メモモード ON" : "メモモード OFF"}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedIndex === null}
            className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
          >
            選択マスをクリア
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            盤面を初期化
          </button>
        </div>

        <div className="flex w-full max-w-full flex-nowrap items-stretch gap-0.5 sm:gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => applyDigit(n)}
              className="flex min-h-11 min-w-0 flex-1 basis-0 touch-manipulation items-center justify-center rounded-md text-lg font-semibold text-zinc-900 active:bg-zinc-100 sm:min-h-12 sm:text-xl sm:hover:bg-zinc-50"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-8 space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-800">values81</p>
          <textarea
            readOnly
            value={values81}
            className="h-20 w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-xs text-zinc-800"
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-800">candidateMasks81</p>
          <textarea
            readOnly
            value={candidateMasks81}
            className="h-28 w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-xs text-zinc-800"
          />
        </div>
      </section>
    </main>
  );
}
