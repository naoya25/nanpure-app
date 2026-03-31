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
 * 空マスでメモ未入力のマスが 1 つでもあれば実行しない（自動ペンシルは行わない）。
 *
 * 1 回の適用では行×数字→列×数字の走査順で、最初に候補削除が起きるパターンだけを行う。
 */
export function tryBoxLineReductionStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  return tryBoxLineReductionEliminationAfterPencil(grid);
}

function tryBoxLineReductionEliminationAfterPencil(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  // 行×数字ごとに初回のみ適用
  for (let r = 0; r < 9; r++) {
    const rowCells = sudokuRowCellIndices(r);

    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);
      const elimBitsByCell = new Array<number>(81).fill(0);

      const blockSet = new Set<number>();
      for (const i of rowCells) {
        if (values[i] !== 0) continue;
        if (getMask(i) & bit) blockSet.add(cellBlockIndex(i));
      }

      if (blockSet.size !== 1) continue;
      const block = blockSet.values().next().value as number;

      for (const j of sudokuBlockCellIndices(block)) {
        if (Math.floor(j / 9) === r) continue;
        if (values[j] !== 0) continue;
        if (getMask(j) & bit) elimBitsByCell[j] |= bit;
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

  // 列×数字ごとに初回のみ適用
  for (let c = 0; c < 9; c++) {
    const colCells = sudokuColCellIndices(c);

    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);
      const elimBitsByCell = new Array<number>(81).fill(0);

      const blockSet = new Set<number>();
      for (const i of colCells) {
        if (values[i] !== 0) continue;
        if (getMask(i) & bit) blockSet.add(cellBlockIndex(i));
      }

      if (blockSet.size !== 1) continue;
      const block = blockSet.values().next().value as number;

      for (const j of sudokuBlockCellIndices(block)) {
        if ((j % 9) === c) continue;
        if (values[j] !== 0) continue;
        if (getMask(j) & bit) elimBitsByCell[j] |= bit;
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

