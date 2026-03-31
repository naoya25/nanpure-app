"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SudokuBoard } from "@/components/nanpure/SudokuBoard";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { parseCandidateMasks81String, parsePuzzle81 } from "@/lib/validates/grid";

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
  const [values81Input, setValues81Input] = useState("");
  const [values81InputError, setValues81InputError] = useState<string | null>(
    null,
  );
  const [candidateMasks81Input, setCandidateMasks81Input] = useState("");
  const [candidateMasks81InputError, setCandidateMasks81InputError] = useState<
    string | null
  >(null);

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
    setValues81InputError(null);
    setCandidateMasks81InputError(null);
  }, []);

  const applyValues81Input = useCallback(() => {
    const normalized = values81Input.trim();
    try {
      const parsed = parsePuzzle81(normalized);
      setBoard(SudokuGrid.fromValues(parsed.values));
      setSelectedIndex(null);
      setValues81InputError(null);
    } catch {
      setValues81InputError("81文字の 0〜9 で入力してください。");
    }
  }, [values81Input]);

  const applyCandidateMasks81Input = useCallback(() => {
    try {
      const masks = parseCandidateMasks81String(candidateMasks81Input);
      const values = [...board.values()];
      setBoard(SudokuGrid.fromValuesAndCandidateMasks(values, masks));
      setSelectedIndex(null);
      setCandidateMasks81InputError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "候補マスクの解析に失敗しました。";
      setCandidateMasks81InputError(msg);
    }
  }, [board, candidateMasks81Input]);

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
          <p className="mb-1 text-sm font-medium text-zinc-800">values81 を入力して反映</p>
          <textarea
            value={values81Input}
            onChange={(e) => {
              setValues81Input(e.target.value);
              if (values81InputError !== null) setValues81InputError(null);
            }}
            placeholder="例: 005060008004007000000203000000030024000000900237040100140008060008001000000050003"
            className="h-20 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-800"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={applyValues81Input}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              盤面に反映
            </button>
            {values81InputError ? (
              <p className="text-xs text-red-600">{values81InputError}</p>
            ) : (
              <p className="text-xs text-zinc-500">空マスは 0 を使います</p>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-800">values81</p>
          <textarea
            readOnly
            value={values81}
            className="h-20 w-full rounded-md border border-zinc-300 bg-zinc-50 p-2 font-mono text-xs text-zinc-800"
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-800">
            candidateMasks81 を入力して反映
          </p>
          <textarea
            value={candidateMasks81Input}
            onChange={(e) => {
              setCandidateMasks81Input(e.target.value);
              if (candidateMasks81InputError !== null) {
                setCandidateMasks81InputError(null);
              }
            }}
            placeholder='例: [0,324,323,...] または 324,323,0,...（81個・現在の確定値に上書き結合）'
            className="h-28 w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs text-zinc-800"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyCandidateMasks81Input}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              盤面に反映（メモ）
            </button>
            {candidateMasks81InputError ? (
              <p className="text-xs text-red-600">{candidateMasks81InputError}</p>
            ) : (
              <p className="text-xs text-zinc-500">
                確定マスはメモ無視（0 扱い）。空マスのみ候補が更新されます。
              </p>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-800">candidateMasks81（現在の盤）</p>
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
