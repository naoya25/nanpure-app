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
 * ボックス・ライン削減（box-line reduction / claiming）。
 * ある行（または列）で、ある数字の候補が 1 ブロック内にだけ載っているとき、
 * そのブロックの当該行（または列）以外から当該数字の候補を消す。
 *
 * ポイント（これは reverse 方向）:
 * - pointing: ブロック内の行/列拘束（ブロック→行・列方向）
 * - box-line: 行/列内のブロック拘束（行・列→ブロック方向）
 *
 * 候補集合は `pointing` と同様（ピアの確定値＋空マスは memoMask があるとき交差）。
 * 適用後は空マスごとに `getMask & ~削除ビット` をメモとする。
 *
 * ペンシルマーク前提のため、内部で `tryPencilMarkStep` を 1 回だけ呼んでから判定を行う。
 */
export function tryBoxLineReductionStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  const pencilRes = tryPencilMarkStep(grid);
  const work = pencilRes?.grid ?? grid;
  const boxLineRes = tryBoxLineReductionEliminationAfterPencil(work);
  if (boxLineRes) {
    const cellIndex =
      pencilRes && pencilRes.cellIndex.length > 0
        ? [...new Set([...pencilRes.cellIndex, ...boxLineRes.cellIndex])]
        : boxLineRes.cellIndex;
    return { cellIndex, grid: boxLineRes.grid };
  }
  return pencilRes ?? null;
}

function tryBoxLineReductionEliminationAfterPencil(
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

  // 行ベース（行→ブロック）
  for (let r = 0; r < 9; r++) {
    const rowCells = sudokuRowCellIndices(r);

    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);

      const blockSet = new Set<number>();
      for (const i of rowCells) {
        if (values[i] !== 0) continue;
        if (getMask(i) & bit) blockSet.add(cellBlockIndex(i));
      }

      if (blockSet.size !== 1) continue;
      const block = blockSet.values().next().value as number;

      for (const j of sudokuBlockCellIndices(block)) {
        if (Math.floor(j / 9) === r) continue; // 当該行以外
        if (values[j] !== 0) continue;
        if (getMask(j) & bit) elimBitsByCell[j] |= bit;
      }
    }
  }

  // 列ベース（列→ブロック）
  for (let c = 0; c < 9; c++) {
    const colCells = sudokuColCellIndices(c);

    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);

      const blockSet = new Set<number>();
      for (const i of colCells) {
        if (values[i] !== 0) continue;
        if (getMask(i) & bit) blockSet.add(cellBlockIndex(i));
      }

      if (blockSet.size !== 1) continue;
      const block = blockSet.values().next().value as number;

      for (const j of sudokuBlockCellIndices(block)) {
        if ((j % 9) === c) continue; // 当該列以外
        if (values[j] !== 0) continue;
        if (getMask(j) & bit) elimBitsByCell[j] |= bit;
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

