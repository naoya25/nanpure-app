import {
  buildTechniqueResultFromElimBits,
  hasEmptyCellWithoutMemo,
  makeGetMask,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

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
 * 適用後は空マスごとに `getMask & ~削除ビット` をメモとする。
 *
 * 空マスでメモ未入力のマスが 1 つでもあれば実行しない（自動ペンシルは行わない）。
 *
 * 1 回の適用ではブロック×数字の走査順で最初に候補削除が起きるパターンだけを行う（複数パターンをまとめない）。
 */
export function tryPointingStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  return tryPointingEliminationAfterPencil(grid);
}

function tryPointingEliminationAfterPencil(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  for (let b = 0; b < 9; b++) {
    const blockCells = sudokuBlockCellIndices(b);
    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);
      const elimBitsByCell = new Array<number>(81).fill(0);
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

      const hit = buildTechniqueResultFromElimBits(
        grid,
        values,
        getMask,
        elimBitsByCell,
      );
      if (hit) return hit;
    }
  }

  return null;
}

