"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  loadDifficultyPercent,
  saveDifficultyPercent,
} from "@/lib/services/difficulty_settings";
import {
  preparePuzzleForPlay,
  type PreparePuzzleForPlayResult,
} from "@/lib/services/prepare_puzzle_for_play";
import {
  replenishPuzzleStockInBackground,
  returnPuzzleToStock,
} from "@/lib/services/replenish_puzzle_stock";
import {
  puzzleSessionReducer,
  requestFromQuery,
  type PuzzleRequest,
  type PuzzleSessionState,
} from "@/lib/services/puzzle_session";
import { DEFAULT_DIFFICULTY_PERCENT } from "@/lib/types/puzzle";

const INITIAL_STATE: PuzzleSessionState = { status: "idle" };

function prepareForRequest(
  request: PuzzleRequest,
): Promise<PreparePuzzleForPlayResult> {
  if (request.kind === "shared") {
    return preparePuzzleForPlay(request.puzzle81, DEFAULT_DIFFICULTY_PERCENT);
  }
  return preparePuzzleForPlay(null, request.difficulty);
}

export function usePuzzleSession(): {
  state: PuzzleSessionState;
  retry: () => void;
} {
  const searchParams = useSearchParams();
  const [savedDifficulty] = useState(loadDifficultyPercent);
  const satisfiedKeyRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const activeRequestRef = useRef<PuzzleRequest | null>(null);
  const runRef = useRef<{ request: PuzzleRequest; promise: Promise<void> } | null>(
    null,
  );
  const retryNonceRef = useRef(0);

  const [state, dispatch] = useReducer(puzzleSessionReducer, INITIAL_STATE);

  const derivedRequest = useMemo(
    () =>
      requestFromQuery(searchParams.get("p"), searchParams.get("d"), savedDifficulty),
    [searchParams, savedDifficulty],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    activeRequestRef.current = state.status === "idle" ? null : state.request;
  }, [state]);

  useEffect(() => {
    if (derivedRequest.key === satisfiedKeyRef.current) return;
    dispatch({ type: "request", request: derivedRequest });
  }, [derivedRequest]);

  useEffect(() => {
    const request = state.status === "idle" ? null : state.request;
    if (!request) return;
    if (runRef.current?.request === request) return;

    const startPathname = window.location.pathname;

    const promise = prepareForRequest(request).then((outcome) => {
      if (!mountedRef.current || activeRequestRef.current !== request) {
        if (outcome.outcome === "ok") returnPuzzleToStock(outcome.puzzle);
        return;
      }

      const canCanonicalize =
        outcome.outcome === "ok" && window.location.pathname === startPathname;
      satisfiedKeyRef.current = canCanonicalize
        ? `p:${outcome.puzzle.puzzle_81}`
        : request.key;
      if (canCanonicalize) {
        window.history.replaceState(
          null,
          "",
          `${startPathname}?p=${encodeURIComponent(outcome.puzzle.puzzle_81)}`,
        );
      }

      dispatch({ type: "resolved", request, outcome });

      if (outcome.outcome === "ok" && request.kind === "new") {
        saveDifficultyPercent(request.difficulty);
        replenishPuzzleStockInBackground(request.difficulty);
      }
    });

    runRef.current = { request, promise };
  }, [state]);

  const retry = useCallback(() => {
    retryNonceRef.current += 1;
    dispatch({
      type: "request",
      request: {
        ...derivedRequest,
        key: `${derivedRequest.key}#${retryNonceRef.current}`,
      },
    });
  }, [derivedRequest]);

  return { state, retry };
}
