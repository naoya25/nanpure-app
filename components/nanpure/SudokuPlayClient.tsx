"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ControlPad } from "@/components/nanpure/ControlPad";
import { SudokuBoard } from "@/components/nanpure/SudokuBoard";
import { PlayHistory } from "@/lib/models/play_history";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import {
  runTechniqueAutoUntilNoChange,
  runTechniqueStep,
} from "@/lib/models/sudoku_technique_runner";
import {
  TECHNIQUE_LABELS,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";
import { parsePuzzle81 } from "@/lib/validates/grid";
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

/** 自動実行の既定チェック: ペンシルマークまで（メモ前提テクニックはオフ） */
function initialAutoRunTechniqueSelection(): ReadonlySet<TechniqueId> {
  const pencilIdx = TECHNIQUE_LABELS.findIndex(
    (t) => t.id === TechniqueId.PENCIL_MARK,
  );
  const throughPencil =
    pencilIdx >= 0
      ? TECHNIQUE_LABELS.slice(0, pencilIdx + 1)
      : TECHNIQUE_LABELS;
  return new Set(throughPencil.map((t) => t.id));
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
  const [phase, setPhase] = useState<"playing" | "result" | "review">(
    "playing",
  );
  const [won, setWon] = useState<boolean | null>(null);
  const [showTechniqueList, setShowTechniqueList] = useState(false);
  const [showAutoRunList, setShowAutoRunList] = useState(false);
  const [techniqueHighlightedCells, setTechniqueHighlightedCells] =
    useState<ReadonlySet<number> | null>(null);
  const [selectedTechniqueIdsForAuto, setSelectedTechniqueIdsForAuto] =
    useState<ReadonlySet<TechniqueId>>(initialAutoRunTechniqueSelection);

  const techniqueButtons = TECHNIQUE_LABELS;

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const values81 = board.values().join("");
    const candidateMasks81 = Array.from(
      { length: 81 },
      (_, i) => board.cellAt(i).memoMask,
    );
    console.log("[SudokuPlay debug] position", { values81, candidateMasks81 });
  }, [board]);

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
      const nh = h.recordNext(next, null, [i]);
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

      const result = runTechniqueStep(grid, techniqueId, puzzle.solution_81);

      if (!result) return;

      const next = result.grid;
      const nextValues = next.values();
      const uniqueChangedCells = Array.from(new Set(result.cellIndex));
      const nh = h.recordNext(next, techniqueId, uniqueChangedCells);
      setHistory(nh);
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

  const toggleTechniqueSelectionForAuto = useCallback(
    (techniqueId: TechniqueId) => {
      setSelectedTechniqueIdsForAuto((prev) => {
        const next = new Set(prev);
        if (next.has(techniqueId)) next.delete(techniqueId);
        else next.add(techniqueId);
        return next;
      });
    },
    [],
  );

  const selectAllTechniqueSelectionsForAuto = useCallback(() => {
    setSelectedTechniqueIdsForAuto(new Set(TECHNIQUE_LABELS.map((t) => t.id)));
  }, []);

  const applyTechniquesAuto = useCallback(() => {
    if (phase !== "playing") return;
    const ids = Array.from(selectedTechniqueIdsForAuto);
    if (ids.length === 0) return;

    const h = historyRef.current;
    const { grid: nextGrid, steps } = runTechniqueAutoUntilNoChange(
      h.present,
      ids,
      puzzle.solution_81,
    );

    if (steps.length === 0) {
      setShowAutoRunList(false);
      return;
    }

    let nh = h;
    for (const step of steps) {
      nh = nh.recordNext(
        step.grid,
        step.techniqueId,
        Array.from(new Set(step.cellIndex)),
      );
    }
    setHistory(nh);

    const highlighted = new Set<number>();
    for (const step of steps) {
      for (const i of step.cellIndex) highlighted.add(i);
    }
    setTechniqueHighlightedCells(highlighted);

    const initialValues = h.present.values();
    const finalValues = nextGrid.values();
    let mismatchCount = 0;
    for (let i = 0; i < 81; i++) {
      if (initialValues[i] === finalValues[i]) continue;
      if (finalValues[i] === 0) continue;
      const expected = Number(puzzle.solution_81[i] ?? 0);
      if (finalValues[i] !== expected) mismatchCount += 1;
    }
    if (mismatchCount > 0) {
      setMistakes((m) => m + mismatchCount);
    }

    const values = [...finalValues];
    if (isBoardComplete(values)) {
      setPhase("result");
      setWon(isBoardMatchingSolution(values, puzzle.solution_81));
    }

    setShowAutoRunList(false);
  }, [phase, puzzle.solution_81, selectedTechniqueIdsForAuto]);

  const clearCell = useCallback(() => {
    if (phase !== "playing") return;
    if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
    const i = selectedIndex;
    const h = historyRef.current;
    const nh = h.recordNext(h.present.clearCell(i), null, [i]);
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
      const nh = h.recordNext(h.present.toggleMemo(i, digit), null, [i]);
      setHistory(nh);
      setTechniqueHighlightedCells(null);
    },
    [phase, selectedIndex, cellReadOnly],
  );

  const undo = useCallback(() => {
    if (phase !== "playing" && phase !== "review") return;
    const h = historyRef.current;
    const changed = h.presentCellIndex;
    const nh = h.undo();
    setHistory(nh);
    setTechniqueHighlightedCells(changed ? new Set(changed) : null);
  }, [phase]);

  const redo = useCallback(() => {
    if (phase !== "playing" && phase !== "review") return;
    const h = historyRef.current;
    const nh = h.redo();
    setHistory(nh);
    setTechniqueHighlightedCells(
      nh.presentCellIndex ? new Set(nh.presentCellIndex) : null,
    );
  }, [phase]);

  const startReplayFromResult = useCallback(() => {
    let h = historyRef.current;
    while (h.canUndo) {
      h = h.undo();
    }
    setHistory(h);
    setSelectedIndex(null);
    setTechniqueHighlightedCells(null);
    setShowTechniqueList(false);
    setShowAutoRunList(false);
    setPhase("review");
  }, []);

  const exitReplayToResult = useCallback(() => {
    let h = historyRef.current;
    while (h.canRedo) {
      h = h.redo();
    }
    setHistory(h);
    setSelectedIndex(null);
    setTechniqueHighlightedCells(null);
    setPhase("result");
  }, []);

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
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {won ? (
            <button
              type="button"
              onClick={startReplayFromResult}
              className="inline-flex justify-center rounded-lg border border-amber-600 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100"
            >
              振り返る
            </button>
          ) : null}
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

  if (phase === "review") {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-medium">振り返り</p>
          <p className="mt-1 text-amber-900/90">
            初期盤面から「一手進める」で操作を順に再表示できます。「一手戻る」で戻せます。盤と数字入力は使えません。
          </p>
        </div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">ナンプレ</h1>
            {puzzle.description ? (
              <p className="mt-1 text-sm text-zinc-600">{puzzle.description}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2 text-right text-sm">
            <button
              type="button"
              onClick={exitReplayToResult}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-800 hover:bg-zinc-50"
            >
              結果に戻る
            </button>
            <p className="text-zinc-600">
              ミス:{" "}
              <span className="font-semibold text-zinc-900">{mistakes}</span>
            </p>
          </div>
        </div>

        <div>
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
            interactionDisabled
          />
          {history.presentTechniqueId ? (
            <p className="mt-2 text-center text-xs text-zinc-500">
              technique: {history.presentTechniqueId}
            </p>
          ) : null}
          <ControlPad
            digitComplete={digitComplete}
            onApplyDigit={applyDigit}
            onToggleMemo={toggleMemoAtSelection}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            canClearCell={false}
            onUndo={undo}
            onRedo={redo}
            onClearCell={clearCell}
            showTechniqueList={showTechniqueList}
            onToggleTechniqueList={() => setShowTechniqueList(false)}
            onCloseTechniqueList={() => setShowTechniqueList(false)}
            showAutoRunList={showAutoRunList}
            onToggleAutoRunList={() => setShowAutoRunList(false)}
            onCloseAutoRunList={() => setShowAutoRunList(false)}
            onApplyTechnique={applyTechnique}
            selectedTechniqueIds={selectedTechniqueIdsForAuto}
            onToggleTechniqueSelection={toggleTechniqueSelectionForAuto}
            onSelectAllTechniqueSelections={selectAllTechniqueSelectionsForAuto}
            onAutoRunTechniques={applyTechniquesAuto}
            canAutoRunTechniques={false}
            techniqueButtons={techniqueButtons}
            isPlaying={false}
            replayMode
            onFocusAnyControl={clearTechniqueHighlightOnFocus}
          />
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
        {history.presentTechniqueId ? (
          <p className="mt-2 text-center text-xs text-zinc-500">
            technique: {history.presentTechniqueId}
          </p>
        ) : null}
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
          onToggleTechniqueList={() =>
            setShowTechniqueList((v) => {
              const next = !v;
              if (next) setShowAutoRunList(false);
              return next;
            })
          }
          onCloseTechniqueList={() => setShowTechniqueList(false)}
          showAutoRunList={showAutoRunList}
          onToggleAutoRunList={() =>
            setShowAutoRunList((v) => {
              const next = !v;
              if (next) setShowTechniqueList(false);
              return next;
            })
          }
          onCloseAutoRunList={() => setShowAutoRunList(false)}
          onApplyTechnique={applyTechnique}
          selectedTechniqueIds={selectedTechniqueIdsForAuto}
          onToggleTechniqueSelection={toggleTechniqueSelectionForAuto}
          onSelectAllTechniqueSelections={selectAllTechniqueSelectionsForAuto}
          onAutoRunTechniques={applyTechniquesAuto}
          canAutoRunTechniques={
            phase === "playing" && selectedTechniqueIdsForAuto.size > 0
          }
          techniqueButtons={techniqueButtons}
          isPlaying={phase === "playing"}
          onFocusAnyControl={clearTechniqueHighlightOnFocus}
        />
      </div>
    </main>
  );
}
