import {
  buildTechniqueResultFromElimBits,
  hasEmptyCellWithoutMemo,
  makeGetMask,
  popcount9,
} from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

function blockIndex(cell: number): number {
  const r = Math.floor(cell / 9);
  const c = cell % 9;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

/**
 * ユニーク長方形 Type 1:
 * 2行×2列の4隅が同じ二値候補 {a,b} を共有し、そのうち3セルがちょうど {a,b}、
 * 残り1セルのみ追加候補を持つとき、その1セルから {a,b} を削除する。
 *
 * 一意解を仮定するテクニック。
 */
export function tryUniqueRectangleStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  for (let r1 = 0; r1 < 9; r1++) {
    for (let r2 = r1 + 1; r2 < 9; r2++) {
      for (let c1 = 0; c1 < 9; c1++) {
        for (let c2 = c1 + 1; c2 < 9; c2++) {
          const corners = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
          if (corners.some((i) => values[i] !== 0)) continue;

          const blockSet = new Set(corners.map((i) => blockIndex(i)));
          // UR は 2 ブロック構成（4 ブロック跨ぎは対象外）
          if (blockSet.size !== 2) continue;

          for (let a = 1; a <= 8; a++) {
            for (let b = a + 1; b <= 9; b++) {
              const pairMask = (1 << (a - 1)) | (1 << (b - 1));
              if (popcount9(pairMask) !== 2) continue;

              // 4隅とも {a,b} を候補に含む必要
              if (corners.some((i) => (getMask(i) & pairMask) !== pairMask)) continue;

              const exactPairCells = corners.filter((i) => getMask(i) === pairMask);
              if (exactPairCells.length !== 3) continue;

              const target = corners.find((i) => getMask(i) !== pairMask);
              if (target === undefined) continue;

              const targetMask = getMask(target);
              // target には追加候補が必要
              if ((targetMask & ~pairMask) === 0) continue;

              const elimBitsByCell = new Array<number>(81).fill(0);
              elimBitsByCell[target] = targetMask & pairMask;
              const hit = buildTechniqueResultFromElimBits(
                grid,
                values,
                getMask,
                elimBitsByCell,
              );
              if (hit) return hit;
            }
          }
        }
      }
    }
  }

  return null;
}
