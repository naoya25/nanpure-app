import type { PreparePuzzleForPlayResult } from "@/lib/services/prepare_puzzle_for_play";
import { isDifficultyPercent } from "@/lib/types/puzzle";
import type { DifficultyPercent, Puzzle } from "@/lib/types/puzzle";

export type PuzzleRequest =
  | { key: string; kind: "shared"; puzzle81: string }
  | { key: string; kind: "new"; difficulty: DifficultyPercent };

export type PuzzleSessionState =
  | { status: "idle" }
  | { status: "preparing"; request: PuzzleRequest }
  | { status: "ready"; request: PuzzleRequest; puzzle: Puzzle }
  | {
      status: "error";
      request: PuzzleRequest;
      kind: "invalid_shared_puzzle" | "generation_failed";
    };

export type PuzzleSessionAction =
  | { type: "request"; request: PuzzleRequest }
  | {
      type: "resolved";
      request: PuzzleRequest;
      outcome: PreparePuzzleForPlayResult;
    };

export function requestFromQuery(
  p: string | null,
  d: string | null,
  savedDifficulty: DifficultyPercent,
): PuzzleRequest {
  if (p) {
    return { key: `p:${p}`, kind: "shared", puzzle81: p };
  }
  const parsed = Number(d);
  const difficulty = isDifficultyPercent(parsed) ? parsed : savedDifficulty;
  return { key: `d:${difficulty}`, kind: "new", difficulty };
}

function requestOf(state: PuzzleSessionState): PuzzleRequest | null {
  return state.status === "idle" ? null : state.request;
}

export function puzzleSessionReducer(
  state: PuzzleSessionState,
  action: PuzzleSessionAction,
): PuzzleSessionState {
  if (action.type === "request") {
    // 解決済みの同じ key まで弾くと、毎回同じ ?d= を指す「別の問題」が効かなくなる
    if (state.status === "preparing" && state.request.key === action.request.key) {
      return state;
    }
    return { status: "preparing", request: action.request };
  }

  if (requestOf(state) !== action.request) return state;

  const { request, outcome } = action;
  if (outcome.outcome === "ok") {
    return { status: "ready", request, puzzle: outcome.puzzle };
  }
  return { status: "error", request, kind: outcome.outcome };
}
