import {
  ALL_CANDIDATE_BITS,
  popcount9,
} from "@/lib/algorithms/techniques/helper";
import type { SudokuGrid } from "@/lib/models/sudoku_grid";
import { sudokuPeerIndices } from "@/lib/validates/grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/** シングル（候補が 1 つだけの空マス）があればその 1 手（先頭のマス 1 のみ） */
export function trySingleStep(grid: SudokuGrid): TechniqueApplyResult | null {
  // 1周だけ走査し、その周回で見つかった手をすべて適用して返す。
  const values = [...grid.values()];
  let nextGrid = grid;
  const changedCells: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;

    // 「ピアに存在する数字」が確定に十分ならその数字を確定する。
    // candidates は「ピアに出ていない数字集合」。
    let usedMask = 0;
    for (const j of sudokuPeerIndices(i)) {
      if (j === i) continue;
      const v = values[j] ?? 0;
      if (v === 0) continue;
      usedMask |= 1 << (v - 1);
    }

    // もし memo が存在しているなら、矛盾しないように候補集合を交差させる。
    let candidateMask = ALL_CANDIDATE_BITS & ~usedMask;
    const memoMask = nextGrid.cellAt(i).memoMask;
    if (memoMask !== 0) candidateMask &= memoMask;

    if (popcount9(candidateMask) !== 1) continue;

    // `candidateMask` が 1-bit なので、そのビットに対応する数字へ変換する。
    let digit = 0;
    for (let d = 1; d <= 9; d++) {
      if (candidateMask & (1 << (d - 1))) {
        digit = d;
        break;
      }
    }

    const before = nextGrid;
    nextGrid = nextGrid.placeDigit(i, digit).next;
    if (nextGrid !== before) {
      values[i] = digit;
      changedCells.push(i);
    }
  }
  if (changedCells.length === 0) return null;
  return { cellIndex: changedCells, grid: nextGrid };
}
