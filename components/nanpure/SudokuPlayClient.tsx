"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { ControlPad } from "@/components/nanpure/ControlPad";
import { DigitConfirmDialog } from "@/components/nanpure/DigitConfirmDialog";
import { PlayResultPanel } from "@/components/nanpure/PlayResultPanel";
import { CELL_SIZE_EXPR, SudokuBoard } from "@/components/nanpure/SudokuBoard";
import { useTechniquePlayback } from "@/components/nanpure/useTechniquePlayback";
import {
  createPlaySession,
  isCellReadOnly,
  isDigitComplete,
  isDigitMismatchingSolution,
  playSessionReducer,
} from "@/lib/models/play_session";
import { PlayHistory } from "@/lib/models/play_history";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import {
  runTechniqueAutoUntilNoChange,
} from "@/lib/models/sudoku_technique_runner";
import {
  loadAutoRunTechniqueIds,
  saveAutoRunTechniqueIds,
} from "@/lib/services/auto_run_settings";
import {
  clearSavedPlay,
  loadSavedPlay,
  savePlay,
} from "@/lib/services/saved_play_progress";
import type { DifficultyPercent, Puzzle } from "@/lib/types/puzzle";
import {
  TECHNIQUE_LABELS,
  TechniqueId,
  type TechniqueAutoRunStep,
} from "@/lib/types/sudoku_technique_types";
import { techniqueIdWebSearchUrl } from "@/lib/utils/technique_web_search";
import { parsePuzzle81 } from "@/lib/validates/grid";

const PROGRESS_SAVE_DEBOUNCE_MS = 300;
const HINT_MESSAGE_TIMEOUT_MS = 3000;
const CELEBRATE_MS = 1300;
const BOARD_GROUP_WIDTH_EXPR = `calc(${CELL_SIZE_EXPR} * 9)`;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function PuzzleDifficultyLine({
  level,
  difficultyPercent,
}: {
  level: number;
  difficultyPercent: DifficultyPercent;
}) {
  return (
    <p className="mt-1 flex items-baseline gap-1.5 text-sm tabular-nums text-zinc-600">
      <span>Level: {level}</span>
      <span className="text-xs text-zinc-400">難易度 {difficultyPercent}%</span>
    </p>
  );
}

function PresentTechniqueFootnote({ techniqueId }: { techniqueId: TechniqueId }) {
  return (
    <p className="mt-2 text-center text-xs text-zinc-500">
      technique:{" "}
      <a
        href={techniqueIdWebSearchUrl(techniqueId)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900"
      >
        {techniqueId}
      </a>
    </p>
  );
}

export type SudokuPlayPuzzle = Puzzle;

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

export function SudokuPlayClient({
  puzzle,
}: {
  puzzle: SudokuPlayPuzzle;
}) {
  const { values: seedValues, fixed } = useMemo(
    () => parsePuzzle81(puzzle.puzzle_81),
    [puzzle.puzzle_81],
  );

  const savedPlay = useMemo(
    () => loadSavedPlay(puzzle.puzzle_81),
    [puzzle.puzzle_81],
  );

  const [state, dispatch] = useReducer(
    playSessionReducer,
    undefined,
    () =>
      createPlaySession(
        { fixed, solution81: puzzle.solution_81 },
        savedPlay?.history ??
          PlayHistory.create(SudokuGrid.fromValues(seedValues)),
        savedPlay?.mistakes ?? 0,
      ),
  );
  const history = state.history;
  const mistakes = state.mistakes;
  const phase = state.phase;
  const board = history.present;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showAutoRunList, setShowAutoRunList] = useState(false);
  const [techniqueHighlightedCells, setTechniqueHighlightedCells] =
    useState<ReadonlySet<number> | null>(null);
  const [selectedTechniqueIdsForAuto, setSelectedTechniqueIdsForAuto] =
    useState<ReadonlySet<TechniqueId>>(
      () => loadAutoRunTechniqueIds() ?? initialAutoRunTechniqueSelection(),
    );
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [pendingDigitInput, setPendingDigitInput] = useState<{
    index: number;
    digit: number;
  } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [prevPhaseKind, setPrevPhaseKind] = useState(phase.kind);

  if (phase.kind !== prevPhaseKind) {
    setPrevPhaseKind(phase.kind);
    if (prevPhaseKind === "playing" && phase.kind === "result" && phase.won) {
      setCelebrating(true);
    }
  }

  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(
      () => setCelebrating(false),
      prefersReducedMotion() ? 0 : CELEBRATE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  const celebratingWin = phase.kind === "result" && phase.won && celebrating;

  const techniqueUsage = useMemo(
    () => history.techniqueUsageOnCurrentPath(),
    [history],
  );

  const handleTechniqueStepShown = useCallback((step: TechniqueAutoRunStep) => {
    setTechniqueHighlightedCells(new Set(step.cellIndex));
  }, []);
  const {
    play: playTechniqueSteps,
    skip: skipTechniquePlayback,
    isPlaying: isTechniquePlaying,
  } = useTechniquePlayback(dispatch, handleTechniqueStepShown);

  const techniqueButtons = TECHNIQUE_LABELS;

  useEffect(() => {
    saveAutoRunTechniqueIds(selectedTechniqueIdsForAuto);
  }, [selectedTechniqueIdsForAuto]);

  useEffect(() => {
    if (hintMessage === null) return;
    const timer = window.setTimeout(
      () => setHintMessage(null),
      HINT_MESSAGE_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [hintMessage]);

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
  const memoMasks81 = useMemo(
    () => Array.from({ length: 81 }, (_, i) => board.cellAt(i).memoMask),
    [board],
  );

  useEffect(() => {
    if (phase.kind !== "playing") return;
    const timer = window.setTimeout(() => {
      savePlay(puzzle.puzzle_81, {
        values: gridValues,
        memoMasks81,
        mistakes,
      });
    }, PROGRESS_SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [gridValues, memoMasks81, mistakes, phase, puzzle.puzzle_81]);

  useEffect(() => {
    if (phase.kind !== "result") return;
    clearSavedPlay(puzzle.puzzle_81);
  }, [phase, puzzle.puzzle_81]);

  /** 選択マスに確定数字があるとき、盤上のメモで同じ数字を強調する */
  const memoHighlightDigit = useMemo(() => {
    if (selectedIndex === null) return null;
    const v = gridValues[selectedIndex];
    return v >= 1 && v <= 9 ? v : null;
  }, [selectedIndex, gridValues]);

  const cellReadOnly = useMemo(
    () => Array.from({ length: 81 }, (_, i) => isCellReadOnly(state, i)),
    [state],
  );

  const digitComplete = useMemo(() => {
    return [
      false,
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => isDigitComplete(state, d)),
    ] as const;
  }, [state]);

  const applyDigit = useCallback(
    (digit: number) => {
      if (phase.kind !== "playing") return;
      if (digitComplete[digit]) return;
      if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
      if (isDigitMismatchingSolution(state, selectedIndex, digit)) {
        setPendingDigitInput({ index: selectedIndex, digit });
        return;
      }
      dispatch({ type: "placeDigit", index: selectedIndex, digit });
      setTechniqueHighlightedCells(null);
    },
    [phase, digitComplete, selectedIndex, cellReadOnly, state],
  );

  const confirmPendingDigitInput = useCallback(() => {
    if (pendingDigitInput === null) return;
    dispatch({
      type: "placeDigit",
      index: pendingDigitInput.index,
      digit: pendingDigitInput.digit,
    });
    setPendingDigitInput(null);
    setTechniqueHighlightedCells(null);
  }, [pendingDigitInput]);

  const cancelPendingDigitInput = useCallback(() => {
    setPendingDigitInput(null);
  }, []);

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
    if (phase.kind !== "playing") return;
    if (isTechniquePlaying) return;
    const ids = Array.from(selectedTechniqueIdsForAuto);
    if (ids.length === 0) return;

    const { steps } = runTechniqueAutoUntilNoChange(
      history.present,
      ids,
      puzzle.solution_81,
    );

    setShowAutoRunList(false);
    if (steps.length === 0) return;

    setHintMessage(null);
    playTechniqueSteps(steps);
  }, [
    phase,
    isTechniquePlaying,
    history,
    puzzle.solution_81,
    selectedTechniqueIdsForAuto,
    playTechniqueSteps,
  ]);

  const requestHint = useCallback(() => {
    if (phase.kind !== "playing") return;
    if (isTechniquePlaying) return;

    const { steps, conflictCellIndex } = runTechniqueAutoUntilNoChange(
      history.present,
      TECHNIQUE_LABELS.map((t) => t.id),
      puzzle.solution_81,
      { maxSteps: 1 },
    );

    if (conflictCellIndex) {
      setHintMessage("間違っているマスがあります");
      setTechniqueHighlightedCells(new Set(conflictCellIndex));
      return;
    }

    if (steps.length === 0) {
      setHintMessage("収録テクニックでは進めません");
      return;
    }

    setHintMessage(null);
    playTechniqueSteps(steps);
  }, [
    phase,
    isTechniquePlaying,
    history,
    puzzle.solution_81,
    playTechniqueSteps,
  ]);

  const canHint = phase.kind === "playing" && !isTechniquePlaying;

  const clearCell = useCallback(() => {
    if (phase.kind !== "playing") return;
    if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
    dispatch({ type: "clearCell", index: selectedIndex });
    setTechniqueHighlightedCells(null);
  }, [phase, selectedIndex, cellReadOnly]);

  const toggleMemoAtSelection = useCallback(
    (digit: number) => {
      if (phase.kind !== "playing") return;
      if (digit < 1 || digit > 9) return;
      if (selectedIndex === null || cellReadOnly[selectedIndex]) return;
      if (board.cellAt(selectedIndex).value !== 0) return;
      dispatch({ type: "toggleMemo", index: selectedIndex, digit });
      setTechniqueHighlightedCells(null);
    },
    [phase, selectedIndex, cellReadOnly, board],
  );

  const undo = useCallback(() => {
    if (phase.kind !== "playing" && phase.kind !== "review") return;
    const changed = history.presentCellIndex;
    dispatch({ type: "undo" });
    setTechniqueHighlightedCells(changed ? new Set(changed) : null);
  }, [phase, history]);

  const redo = useCallback(() => {
    if (phase.kind !== "playing" && phase.kind !== "review") return;
    const nh = history.redo();
    dispatch({ type: "redo" });
    setTechniqueHighlightedCells(
      nh.presentCellIndex ? new Set(nh.presentCellIndex) : null,
    );
  }, [phase, history]);

  const startReplayFromResult = useCallback(() => {
    dispatch({ type: "startReview" });
    setSelectedIndex(null);
    setTechniqueHighlightedCells(null);
    setShowAutoRunList(false);
  }, []);

  const exitReplayToResult = useCallback(() => {
    dispatch({ type: "exitReview" });
    setSelectedIndex(null);
    setTechniqueHighlightedCells(null);
  }, []);

  const handleSelectIndex = useCallback(
    (index: number) => {
      if (isTechniquePlaying) skipTechniquePlayback();
      setSelectedIndex(index);
      setTechniqueHighlightedCells(null);
      setHintMessage(null);
    },
    [isTechniquePlaying, skipTechniquePlayback],
  );

  const clearTechniqueHighlightOnFocus = useCallback(() => {
    setTechniqueHighlightedCells(null);
    setHintMessage(null);
  }, []);

  useEffect(() => {
    if (phase.kind !== "playing") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTechniquePlaying) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // 確認ダイアログ中はダイアログのボタンだけが操作できる（Enter / Space はボタン側で処理）
      if (pendingDigitInput !== null) {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelPendingDigitInput();
        }
        return;
      }

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
  }, [
    phase,
    isTechniquePlaying,
    applyDigit,
    clearCell,
    toggleMemoAtSelection,
    pendingDigitInput,
    cancelPendingDigitInput,
  ]);

  if (phase.kind === "result" && !celebratingWin) {
    return (
      <PlayResultPanel
        won={phase.won}
        level={puzzle.level}
        mistakes={mistakes}
        techniqueUsage={techniqueUsage}
        difficultyPercent={puzzle.difficultyPercent}
        onStartReplay={startReplayFromResult}
      />
    );
  }

  if (phase.kind === "review") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-medium">振り返り</p>
          <p className="mt-1 text-amber-900/90">
            初期盤面から「一手進める」で操作を順に再表示できます。「一手戻る」で戻せます。数字入力は使えませんが、盤面のマス選択ハイライトは確認できます。
          </p>
        </div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">ナンプレ</h1>
            <PuzzleDifficultyLine
              level={puzzle.level}
              difficultyPercent={puzzle.difficultyPercent}
            />
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

        <div className="mx-auto" style={{ width: BOARD_GROUP_WIDTH_EXPR }}>
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
            <PresentTechniqueFootnote techniqueId={history.presentTechniqueId} />
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
            showAutoRunList={showAutoRunList}
            onToggleAutoRunList={() => setShowAutoRunList(false)}
            onCloseAutoRunList={() => setShowAutoRunList(false)}
            selectedTechniqueIds={selectedTechniqueIdsForAuto}
            onToggleTechniqueSelection={toggleTechniqueSelectionForAuto}
            onSelectAllTechniqueSelections={selectAllTechniqueSelectionsForAuto}
            onAutoRunTechniques={applyTechniquesAuto}
            canAutoRunTechniques={false}
            techniqueButtons={techniqueButtons}
            isPlaying={false}
            replayMode
            onHint={requestHint}
            canHint={false}
            hintMessage={null}
            onFocusAnyControl={clearTechniqueHighlightOnFocus}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">ナンプレ</h1>
          <PuzzleDifficultyLine
            level={puzzle.level}
            difficultyPercent={puzzle.difficultyPercent}
          />
        </div>
        <div className="text-right text-sm text-zinc-600">
          <p>
            ミス:{" "}
            <span className="font-semibold text-zinc-900">{mistakes}</span>
          </p>
          <div className="mt-2 flex flex-col gap-1">
            <Link
              href={`/play/?d=${puzzle.difficultyPercent}`}
              className="text-left text-zinc-500 underline hover:text-zinc-800"
            >
              別の問題（{puzzle.difficultyPercent}%）
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

      <div
        className="play-surface-cursor mx-auto"
        style={{ width: BOARD_GROUP_WIDTH_EXPR }}
      >
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
          celebrate={celebratingWin}
        />
        {history.presentTechniqueId ? (
          <PresentTechniqueFootnote techniqueId={history.presentTechniqueId} />
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
            phase.kind === "playing"
          }
          onUndo={undo}
          onRedo={redo}
          onClearCell={clearCell}
          showAutoRunList={showAutoRunList}
          onToggleAutoRunList={() =>
            setShowAutoRunList((v) => {
              const next = !v;
              return next;
            })
          }
          onCloseAutoRunList={() => setShowAutoRunList(false)}
          selectedTechniqueIds={selectedTechniqueIdsForAuto}
          onToggleTechniqueSelection={toggleTechniqueSelectionForAuto}
          onSelectAllTechniqueSelections={selectAllTechniqueSelectionsForAuto}
          onAutoRunTechniques={applyTechniquesAuto}
          canAutoRunTechniques={
            phase.kind === "playing" && selectedTechniqueIdsForAuto.size > 0
          }
          techniqueButtons={techniqueButtons}
          isPlaying={phase.kind === "playing"}
          inputLocked={isTechniquePlaying}
          onHint={requestHint}
          canHint={canHint}
          hintMessage={hintMessage}
          onFocusAnyControl={clearTechniqueHighlightOnFocus}
        />
      </div>
      <DigitConfirmDialog
        digit={pendingDigitInput?.digit ?? null}
        onConfirm={confirmPendingDigitInput}
        onCancel={cancelPendingDigitInput}
      />
    </main>
  );
}
