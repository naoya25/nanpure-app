import {
  ALL_CANDIDATE_BITS,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";
import { tryPencilMarkStep } from "@/lib/algorithms/techniques/pencil_mark";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { sudokuPeerIndices } from "@/lib/validates/grid";

/** セルインデックス `0..80` の属するブロック番号 `0..8`（左→右・上→下） */
function cellBlockIndex(i: number): number {
  const r = Math.floor(i / 9);
  const c = i % 9;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

/**
 * ポインティング（intersection / box-line でブロック→行・列方向）。
 * 某ブロック内で某数字の候補が 1 行（または 1 列）にだけ載っているとき、
 * その行（列）のブロック外から当該数字の候補を消す。
 *
 * 候補集合は `hidden_single` 等と同様（ピアの確定値＋空マスは `memoMask` があるとき交差）。
 * 適用後は空マスごとに `getMask & ~削除ビット` をメモとする（memo 未入力のマスも自動候補に合わせて更新）。
 *
 * ペンシルマーク前提のため、内部で `tryPencilMarkStep` を 1 回だけ呼んでからポインティング判定を行う。
 */
export function tryPointingStep(grid: SudokuGrid): TechniqueApplyResult | null {
  const pencilRes = tryPencilMarkStep(grid);
  const work = pencilRes?.grid ?? grid;
  const pointRes = tryPointingEliminationAfterPencil(work);
  if (pointRes) {
    const cellIndex =
      pencilRes && pencilRes.cellIndex.length > 0
        ? [...new Set([...pencilRes.cellIndex, ...pointRes.cellIndex])]
        : pointRes.cellIndex;
    return { cellIndex, grid: pointRes.grid };
  }
  return pencilRes ?? null;
}

function tryPointingEliminationAfterPencil(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const getMask = (cellIndex: number) => {
    if (values[cellIndex] !== 0) return 0;

    let usedMask = 0;
    for (const j of sudokuPeerIndices(cellIndex)) {
      if (j === cellIndex) continue;
      const v = values[j] ?? 0;
      if (v === 0) continue;
      usedMask |= 1 << (v - 1);
    }

    let candidateMask = ALL_CANDIDATE_BITS & ~usedMask;
    const memoMask = grid.cellAt(cellIndex).memoMask;
    if (memoMask !== 0) candidateMask &= memoMask;
    return candidateMask;
  };

  const elimBitsByCell = new Array<number>(81).fill(0);

  for (let b = 0; b < 9; b++) {
    const blockCells = sudokuBlockCellIndices(b);
    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);
      const inBlock: number[] = [];
      for (const i of blockCells) {
        if (values[i] !== 0) continue;
        if (getMask(i) & bit) inBlock.push(i);
      }
      if (inBlock.length === 0) continue;

      const r0 = Math.floor(inBlock[0]! / 9);
      const rowLine = inBlock.every((i) => Math.floor(i / 9) === r0);
      if (rowLine) {
        for (const i of sudokuRowCellIndices(r0)) {
          if (cellBlockIndex(i) === b) continue;
          if (values[i] !== 0) continue;
          if (getMask(i) & bit) elimBitsByCell[i] |= bit;
        }
      }

      const c0 = inBlock[0]! % 9;
      const colLine = inBlock.every((i) => (i % 9) === c0);
      if (colLine) {
        for (const i of sudokuColCellIndices(c0)) {
          if (cellBlockIndex(i) === b) continue;
          if (values[i] !== 0) continue;
          if (getMask(i) & bit) elimBitsByCell[i] |= bit;
        }
      }
    }
  }

  const nextMasks = Array.from({ length: 81 }, (__, i) => {
    if (values[i] !== 0) return 0;
    return getMask(i) & ~elimBitsByCell[i]!;
  });

  const changedCells: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    const prev = grid.cellAt(i).memoMask & 0x1ff;
    if (nextMasks[i]! !== prev) {
      changedCells.push(i);
    }
  }

  if (changedCells.length === 0) return null;

  return {
    cellIndex: changedCells,
    grid: SudokuGrid.fromValuesAndCandidateMasks(values, nextMasks),
  };
}

