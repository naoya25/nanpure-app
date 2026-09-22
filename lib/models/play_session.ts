import { PlayHistory } from "@/lib/models/play_history";
import { SUDOKU_CELLS } from "@/lib/validates/grid";
import type { TechniqueAutoRunStep } from "@/lib/types/sudoku_technique_types";
import {
  isBoardComplete,
  isBoardMatchingSolution,
  isEverySolutionCellForDigitFilled,
} from "@/lib/validates/validate";

export type PlaySessionConfig = {
  fixed: readonly boolean[];
  solution81: string;
};

export type PlayPhase =
  | { kind: "playing" }
  | { kind: "result"; won: boolean }
  | { kind: "review"; won: boolean };

export type PlaySessionState = {
  config: PlaySessionConfig;
  history: PlayHistory;
  mistakes: number;
  phase: PlayPhase;
  playbackLocked: boolean;
};

export type PlaySessionAction =
  | { type: "placeDigit"; index: number; digit: number }
  | { type: "clearCell"; index: number }
  | { type: "toggleMemo"; index: number; digit: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "beginPlayback" }
  | { type: "applyTechniqueStep"; step: TechniqueAutoRunStep }
  | { type: "endPlayback" }
  | { type: "startReview" }
  | { type: "exitReview" };

export function createPlaySession(
  config: PlaySessionConfig,
  history: PlayHistory,
  mistakes: number,
): PlaySessionState {
  return {
    config,
    history,
    mistakes,
    phase: { kind: "playing" },
    playbackLocked: false,
  };
}

export function isCellReadOnly(state: PlaySessionState, index: number): boolean {
  if (state.config.fixed[index]) return true;
  const v = state.history.present.values()[index];
  return v >= 1 && v <= 9 && String(v) === state.config.solution81[index];
}

export function isDigitComplete(state: PlaySessionState, digit: number): boolean {
  return isEverySolutionCellForDigitFilled(
    digit,
    state.history.present.values(),
    state.config.solution81,
  );
}

function applyPlaceDigit(
  state: PlaySessionState,
  action: Extract<PlaySessionAction, { type: "placeDigit" }>,
): PlaySessionState {
  if (state.phase.kind !== "playing") return state;
  if (state.playbackLocked) return state;
  if (isDigitComplete(state, action.digit)) return state;
  if (isCellReadOnly(state, action.index)) return state;

  const { next, matchesSolution } = state.history.present.placeDigit(
    action.index,
    action.digit,
    state.config.solution81,
  );
  const history = state.history.recordNext(next, null, [action.index]);

  if (!matchesSolution) {
    return { ...state, history, mistakes: state.mistakes + 1 };
  }

  const values = [...next.values()];
  if (isBoardComplete(values)) {
    return {
      ...state,
      history,
      phase: {
        kind: "result",
        won: isBoardMatchingSolution(values, state.config.solution81),
      },
    };
  }
  return { ...state, history };
}

function applyClearCell(
  state: PlaySessionState,
  action: Extract<PlaySessionAction, { type: "clearCell" }>,
): PlaySessionState {
  if (state.phase.kind !== "playing") return state;
  if (state.playbackLocked) return state;
  if (isCellReadOnly(state, action.index)) return state;
  const history = state.history.recordNext(
    state.history.present.clearCell(action.index),
    null,
    [action.index],
  );
  return { ...state, history };
}

function applyToggleMemo(
  state: PlaySessionState,
  action: Extract<PlaySessionAction, { type: "toggleMemo" }>,
): PlaySessionState {
  if (state.phase.kind !== "playing") return state;
  if (state.playbackLocked) return state;
  if (action.digit < 1 || action.digit > 9) return state;
  if (isCellReadOnly(state, action.index)) return state;
  if (state.history.present.cellAt(action.index).value !== 0) return state;
  const history = state.history.recordNext(
    state.history.present.toggleMemo(action.index, action.digit),
    null,
    [action.index],
  );
  return { ...state, history };
}

function applyUndo(state: PlaySessionState): PlaySessionState {
  if (state.phase.kind !== "playing" && state.phase.kind !== "review") {
    return state;
  }
  if (state.playbackLocked) return state;
  const history = state.history.undo();
  if (history === state.history) return state;
  return { ...state, history };
}

function applyRedo(state: PlaySessionState): PlaySessionState {
  if (state.phase.kind !== "playing" && state.phase.kind !== "review") {
    return state;
  }
  if (state.playbackLocked) return state;
  const history = state.history.redo();
  if (history === state.history) return state;
  return { ...state, history };
}

function applyBeginPlayback(state: PlaySessionState): PlaySessionState {
  if (state.phase.kind !== "playing") return state;
  if (state.playbackLocked) return state;
  return { ...state, playbackLocked: true };
}

function applyEndPlayback(state: PlaySessionState): PlaySessionState {
  if (!state.playbackLocked) return state;
  return { ...state, playbackLocked: false };
}

function applyTechniqueStep(
  state: PlaySessionState,
  action: Extract<PlaySessionAction, { type: "applyTechniqueStep" }>,
): PlaySessionState {
  if (state.phase.kind !== "playing") return state;

  const { step } = action;
  const before = state.history.present.values();
  const history = state.history.recordNext(
    step.grid,
    step.techniqueId,
    Array.from(new Set(step.cellIndex)),
  );

  const after = step.grid.values();
  let mismatchCount = 0;
  for (let i = 0; i < SUDOKU_CELLS; i++) {
    if (before[i] === after[i]) continue;
    if (after[i] === 0) continue;
    const expected = Number(state.config.solution81[i] ?? 0);
    if (after[i] !== expected) mismatchCount += 1;
  }
  const mistakes = state.mistakes + mismatchCount;

  const values = [...after];
  if (isBoardComplete(values)) {
    return {
      ...state,
      history,
      mistakes,
      phase: {
        kind: "result",
        won: isBoardMatchingSolution(values, state.config.solution81),
      },
    };
  }
  return { ...state, history, mistakes };
}

function applyStartReview(state: PlaySessionState): PlaySessionState {
  let history = state.history;
  while (history.canUndo) history = history.undo();
  const won = state.phase.kind === "result" ? state.phase.won : false;
  return { ...state, history, phase: { kind: "review", won } };
}

function applyExitReview(state: PlaySessionState): PlaySessionState {
  let history = state.history;
  while (history.canRedo) history = history.redo();
  const won = state.phase.kind === "review" ? state.phase.won : false;
  return { ...state, history, phase: { kind: "result", won } };
}

export function playSessionReducer(
  state: PlaySessionState,
  action: PlaySessionAction,
): PlaySessionState {
  switch (action.type) {
    case "placeDigit":
      return applyPlaceDigit(state, action);
    case "clearCell":
      return applyClearCell(state, action);
    case "toggleMemo":
      return applyToggleMemo(state, action);
    case "undo":
      return applyUndo(state);
    case "redo":
      return applyRedo(state);
    case "beginPlayback":
      return applyBeginPlayback(state);
    case "applyTechniqueStep":
      return applyTechniqueStep(state, action);
    case "endPlayback":
      return applyEndPlayback(state);
    case "startReview":
      return applyStartReview(state);
    case "exitReview":
      return applyExitReview(state);
  }
}
