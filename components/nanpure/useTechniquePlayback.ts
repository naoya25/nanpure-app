import { useEffect, useRef, useState, type Dispatch } from "react";

import type { PlaySessionAction } from "@/lib/models/play_session";
import type { TechniqueAutoRunStep } from "@/lib/types/sudoku_technique_types";

const PLAYBACK_STEP_MS = 350;

function playbackIntervalMs(): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return PLAYBACK_STEP_MS;
  }
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  return reducedMotion ? 0 : PLAYBACK_STEP_MS;
}

export function useTechniquePlayback(
  dispatch: Dispatch<PlaySessionAction>,
  onStepShown: (step: TechniqueAutoRunStep) => void,
): {
  play: (steps: readonly TechniqueAutoRunStep[]) => void;
  skip: () => void;
  isPlaying: boolean;
} {
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const remainingRef = useRef<TechniqueAutoRunStep[]>([]);
  const timerRef = useRef<number | null>(null);
  const dispatchRef = useRef(dispatch);
  const onStepShownRef = useRef(onStepShown);

  useEffect(() => {
    dispatchRef.current = dispatch;
    onStepShownRef.current = onStepShown;
  }, [dispatch, onStepShown]);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const finishPlayback = () => {
    clearTimer();
    remainingRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    dispatchRef.current({ type: "endPlayback" });
  };

  const scheduleAdvance = () => {
    const intervalMs = playbackIntervalMs();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      const step = remainingRef.current.shift();
      if (!step) {
        finishPlayback();
        return;
      }
      dispatchRef.current({ type: "applyTechniqueStep", step });
      onStepShownRef.current(step);
      if (remainingRef.current.length > 0) {
        scheduleAdvance();
      } else {
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          finishPlayback();
        }, intervalMs);
      }
    }, intervalMs);
  };

  useEffect(() => {
    return () => {
      clearTimer();
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        dispatchRef.current({ type: "endPlayback" });
      }
    };
  }, []);

  const play = (steps: readonly TechniqueAutoRunStep[]) => {
    if (steps.length === 0) return;
    if (isPlayingRef.current) return;
    remainingRef.current = [...steps];
    isPlayingRef.current = true;
    setIsPlaying(true);
    dispatchRef.current({ type: "beginPlayback" });
    scheduleAdvance();
  };

  const skip = () => {
    if (!isPlayingRef.current) return;
    clearTimer();
    const steps = remainingRef.current;
    remainingRef.current = [];
    let lastStep: TechniqueAutoRunStep | null = null;
    for (const step of steps) {
      dispatchRef.current({ type: "applyTechniqueStep", step });
      lastStep = step;
    }
    if (lastStep) onStepShownRef.current(lastStep);
    isPlayingRef.current = false;
    setIsPlaying(false);
    dispatchRef.current({ type: "endPlayback" });
  };

  return { play, skip, isPlaying };
}
