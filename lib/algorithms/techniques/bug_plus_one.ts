import {
  buildTechniqueResultFromElimBits,
  hasEmptyCellWithoutMemo,
  makeGetMask,
  popcount9,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

function bitList(mask: number): number[] {
  const out: number[] = [];
  const m = mask & 0x1ff;
  for (let d = 1; d <= 9; d++) {
    const b = 1 << (d - 1);
    if ((m & b) !== 0) out.push(b);
  }
  return out;
}

/**
 * BUG+1（Bivalue Universal Grave + 1）
 *
 * 前提:
 * - 空マスのうち 1 マスだけが 3 候補
 * - それ以外の空マスはすべて 2 候補
 *
 * その 3 候補マスの候補のうち、同じ数字候補が
 * 「そのマスの行・列・ブロック」すべてで 3 回現れる数字を残し、
 * ほかの候補を削除する。
 *
 * 一意解を仮定する手筋。
 */
export function tryBugPlusOneStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  let bugCell = -1;
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    const n = popcount9(getMask(i));
    if (n === 2) continue;
    if (n === 3 && bugCell === -1) {
      bugCell = i;
      continue;
    }
    return null;
  }
  if (bugCell < 0) return null;

  const row = Math.floor(bugCell / 9);
  const col = bugCell % 9;
  const block = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  const bugMask = getMask(bugCell);
  const candidates = bitList(bugMask);

  for (const bit of candidates) {
    const rowCount = sudokuRowCellIndices(row).filter(
      (i) => values[i] === 0 && (getMask(i) & bit) !== 0,
    ).length;
    const colCount = sudokuColCellIndices(col).filter(
      (i) => values[i] === 0 && (getMask(i) & bit) !== 0,
    ).length;
    const blockCount = sudokuBlockCellIndices(block).filter(
      (i) => values[i] === 0 && (getMask(i) & bit) !== 0,
    ).length;
    if (rowCount !== 3 || colCount !== 3 || blockCount !== 3) continue;

    const elimBitsByCell = new Array<number>(81).fill(0);
    elimBitsByCell[bugCell] = bugMask & ~bit;
    return buildTechniqueResultFromElimBits(grid, values, getMask, elimBitsByCell);
  }

  return null;
}
