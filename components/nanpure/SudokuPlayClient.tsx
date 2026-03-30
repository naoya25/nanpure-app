"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ControlPad } from "@/components/nanpure/ControlPad";
import { SudokuBoard } from "@/components/nanpure/SudokuBoard";
import { PlayHistory } from "@/lib/models/play_history";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { runTechniqueStep } from "@/lib/models/sudoku_technique_runner";
import { parsePuzzle81 } from "@/lib/validates/grid";
import {
  TECHNIQUE_BUTTONS,
  type TechniqueId,
} from "@/lib/types/sudoku_technique_types";
import {
  isBoardComplete,
  isBoardMatchingSolution,
  isEverySolutionCellForDigitFilled,
} from "@/lib/validates/validate";

export type SudokuPlayPuzzle = {
  id: string;
  puzzle_81: string;
  solution_81: string;
  description: string | null;
  level: number;
};

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
  const [techniqueHighlightedCells, setTechniqueHighlightedCells] =
    useState<ReadonlySet<number> | null>(null);

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
      setTechniqueHighlightedCells(null);

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
    [phase, digitComplete, selectedIndex, cellReadOnly, puzzle.solution_81],
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
      setTechniqueHighlightedCells(new Set(uniqueChangedCells));
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
    setTechniqueHighlightedCells(null);
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
      setTechniqueHighlightedCells(null);
    },
    [phase, selectedIndex, cellReadOnly],
  );

  const undo = useCallback(() => {
    if (phase !== "playing") return;
    const h = historyRef.current;
    const nh = h.undo();
    setHistory(nh);
    setTechniqueHighlightedCells(null);
  }, [phase]);

  const redo = useCallback(() => {
    if (phase !== "playing") return;
    const h = historyRef.current;
    const nh = h.redo();
    setHistory(nh);
    setTechniqueHighlightedCells(null);
  }, [phase]);

  const handleSelectIndex = useCallback((index: number) => {
    setSelectedIndex(index);
    setTechniqueHighlightedCells(null);
  }, []);

  const clearTechniqueHighlightOnFocus = useCallback(() => {
    setTechniqueHighlightedCells(null);
  }, []);

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

      <div className="play-surface-cursor">
        <SudokuBoard
          gridValues={gridValues}
          fixed={fixed}
          cellReadOnly={cellReadOnly}
          selectedIndex={selectedIndex}
          setSelectedIndex={handleSelectIndex}
          board={board}
          memoHighlightDigit={memoHighlightDigit}
          solution81={puzzle.solution_81}
          techniqueHighlightedCells={techniqueHighlightedCells}
        />
        <ControlPad
          digitComplete={digitComplete}
          onApplyDigit={applyDigit}
          onToggleMemo={toggleMemoAtSelection}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          canClearCell={
            selectedIndex !== null &&
            !cellReadOnly[selectedIndex] &&
            phase === "playing"
          }
          onUndo={undo}
          onRedo={redo}
          onClearCell={clearCell}
          showTechniqueList={showTechniqueList}
          onToggleTechniqueList={() => setShowTechniqueList((v) => !v)}
          onCloseTechniqueList={() => setShowTechniqueList(false)}
          onApplyTechnique={applyTechnique}
          techniqueButtons={techniqueButtons}
          isPlaying={phase === "playing"}
          onFocusAnyControl={clearTechniqueHighlightOnFocus}
        />
      </div>
    </main>
  );
}
