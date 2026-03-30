import { ALL_CANDIDATE_BITS } from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { sudokuPeerIndices } from "@/lib/validates/grid";

/**
 * ペンシルマーク（候補の記入）。
 * 空マスごとに「ピアに存在しない数字だけ」を候補として再計算し、メモを一括更新する。
 */
export function tryPencilMarkStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const nextCandidateMasks = new Array<number>(81).fill(0);
  const changedCells: number[] = [];

  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;

    let usedMask = 0;
    for (const peerIndex of sudokuPeerIndices(i)) {
      if (peerIndex === i) continue;
      const v = values[peerIndex] ?? 0;
      if (v === 0) continue;
      usedMask |= 1 << (v - 1);
    }

    const candidateMask = ALL_CANDIDATE_BITS & ~usedMask;
    nextCandidateMasks[i] = candidateMask;

    if (grid.cellAt(i).memoMask !== candidateMask) {
      changedCells.push(i);
    }
  }

  if (changedCells.length === 0) return null;

  const nextGrid = SudokuGrid.fromValuesAndCandidateMasks(
    values,
    nextCandidateMasks,
  );
  return { cellIndex: changedCells, grid: nextGrid };
}
