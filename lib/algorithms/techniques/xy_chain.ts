import {
  applyEliminationSeeingBothEnds,
  hasEmptyCellWithoutMemo,
  makeGetMask,
  popcount9,
} from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { sudokuPeerIndices } from "@/lib/validates/grid";
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

function otherBit(mask: number, oneBit: number): number {
  return (mask & 0x1ff) & ~oneBit;
}

/**
 * XY-Chain（bivalue only）
 *
 * 二値セルのみをノードとして、以下を交互に辿る:
 * - セル間: 同一候補を共有する弱リンク（同一ハウス）
 * - セル内: 残り候補への強リンク（bivalue なので必ず反転）
 *
 * 鎖の始端と終端が同じ候補 z を持つとき、両端を同時に見るセルから z を削除する。
 */
export function tryXYChainStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);
  const maxCellsInChain = 8;

  const bivalueCells: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    if (popcount9(getMask(i)) === 2) bivalueCells.push(i);
  }
  if (bivalueCells.length < 3) return null;

  const bivalueSet = new Set<number>(bivalueCells);

  for (const start of bivalueCells) {
    const sMask = getMask(start);
    const sBits = bitList(sMask);
    if (sBits.length !== 2) continue;

    for (const targetBit of sBits) {
      const firstCarry = otherBit(sMask, targetBit);
      if (firstCarry === 0) continue;

      const path = [start];
      const used = new Set<number>(path);

      const dfs = (current: number, carryBit: number): TechniqueApplyResult | null => {
        if (path.length >= maxCellsInChain) return null;

        for (const next of sudokuPeerIndices(current)) {
          if (next === current) continue;
          if (used.has(next)) continue;
          if (!bivalueSet.has(next)) continue;
          if (values[next] !== 0) continue;

          const nMask = getMask(next);
          if ((nMask & carryBit) === 0) continue; // weak link by shared digit

          const nextCarry = otherBit(nMask, carryBit);
          if (nextCarry === 0) continue;

          used.add(next);
          path.push(next);

          // close chain:
          // current -> next は carryBit 共有の弱リンクなので、next で真になるのは nextCarry 側。
          // よって終端は「targetBit を含む」だけでは不十分で、nextCarry === targetBit が必要。
          if (path.length >= 3 && nextCarry === targetBit) {
            const hit = applyEliminationSeeingBothEnds(
              grid,
              values,
              getMask,
              start,
              next,
              targetBit,
              path,
            );
            if (hit) return hit;
          }

          const out = dfs(next, nextCarry);
          if (out) return out;

          path.pop();
          used.delete(next);
        }
        return null;
      };

      const hit = dfs(start, firstCarry);
      if (hit) return hit;
    }
  }

  return null;
}
