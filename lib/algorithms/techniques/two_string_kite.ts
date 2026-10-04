import {
  applyEliminationSeeingBothEnds,
  hasEmptyCellWithoutMemo,
  makeGetMask,
} from "@/lib/algorithms/techniques/helper";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { blockLabel, cellsLabel, colLabel, rowLabel } from "@/lib/utils/grid";

function sameBlock(a: number, b: number): boolean {
  const ar = Math.floor(a / 9);
  const ac = a % 9;
  const br = Math.floor(b / 9);
  const bc = b % 9;
  return Math.floor(ar / 3) === Math.floor(br / 3) && Math.floor(ac / 3) === Math.floor(bc / 3);
}

/**
 * ツーストリング・カイト（単一数字）。
 * ある行の共役ペア（2 候補）とある列の共役ペア（2 候補）を取り、
 * それぞれ片側の候補が同一ブロック内で繋がるとき、残りの 2 端点を同時に見るマスから候補を削除する。
 */
export function tryTwoStringKiteStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);

    const rowPairs: Array<readonly [number, number] | null> = new Array(9).fill(null);
    for (let r = 0; r < 9; r++) {
      const cols: number[] = [];
      for (let c = 0; c < 9; c++) {
        if (getMask(r * 9 + c) & bit) cols.push(c);
      }
      if (cols.length === 2) rowPairs[r] = [cols[0]!, cols[1]!];
    }

    const colPairs: Array<readonly [number, number] | null> = new Array(9).fill(null);
    for (let c = 0; c < 9; c++) {
      const rows: number[] = [];
      for (let r = 0; r < 9; r++) {
        if (getMask(r * 9 + c) & bit) rows.push(r);
      }
      if (rows.length === 2) colPairs[c] = [rows[0]!, rows[1]!];
    }

    for (let r = 0; r < 9; r++) {
      const rowPair = rowPairs[r];
      if (!rowPair) continue;

      for (let c = 0; c < 9; c++) {
        const colPair = colPairs[c];
        if (!colPair) continue;

        const rowCellA = r * 9 + rowPair[0];
        const rowCellB = r * 9 + rowPair[1];
        const colCellA = colPair[0] * 9 + c;
        const colCellB = colPair[1] * 9 + c;

        const patterns: Array<
          readonly [number, number, number, number]
        > = [
          [rowCellA, colCellA, rowCellB, colCellB],
          [rowCellA, colCellB, rowCellB, colCellA],
          [rowCellB, colCellA, rowCellA, colCellB],
          [rowCellB, colCellB, rowCellA, colCellA],
        ];
        for (const [connector1, connector2, end1, end2] of patterns) {
          // 行ペアと列ペアがマスを共有する形は凧にならない（ただの強いリンク 1 本）
          if (new Set([connector1, connector2, end1, end2]).size !== 4) continue;
          if (!sameBlock(connector1, connector2)) continue;
          const hit = applyEliminationSeeingBothEnds(
            grid,
            values,
            getMask,
            end1,
            end2,
            bit,
            [end1, end2, connector1, connector2],
          );
          if (hit) {
            const block =
              Math.floor(Math.floor(connector1 / 9) / 3) * 3 +
              Math.floor((connector1 % 9) / 3);
            return {
              ...hit,
              explanation: {
                basisCellIndex: [end1, end2, connector1, connector2],
                reason:
                  `${digit} は${rowLabel(r)}では${cellsLabel([connector1, end1])}のどちらか、${colLabel(c)}では${cellsLabel([connector2, end2])}のどちらかにしか入れない強いリンクです。` +
                  `${cellsLabel([connector1, connector2])}は同じ${blockLabel(block)}にあり同時には ${digit} になれないので、${cellsLabel([end1, end2])}のどちらかは必ず ${digit} になります。` +
                  `この2マスの両方から見えるマスから ${digit} を消せます。`,
              },
            };
          }
        }
      }
    }
  }

  return null;
}
