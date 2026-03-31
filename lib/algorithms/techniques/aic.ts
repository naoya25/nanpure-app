import {
  applyEliminationSeeingBothEnds,
  hasEmptyCellWithoutMemo,
  makeGetMask,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

type EdgeType = "strong" | "weak";

function nodeId(cell: number, digit: number): number {
  return cell * 9 + (digit - 1);
}

function nodeCell(id: number): number {
  return Math.floor(id / 9);
}

function nodeDigit(id: number): number {
  return (id % 9) + 1;
}

function bitList(mask: number): number[] {
  const out: number[] = [];
  const m = mask & 0x1ff;
  for (let d = 1; d <= 9; d++) {
    const b = 1 << (d - 1);
    if ((m & b) !== 0) out.push(d);
  }
  return out;
}

function addUndirected(map: Map<number, Set<number>>, a: number, b: number): void {
  if (a === b) return;
  if (!map.has(a)) map.set(a, new Set<number>());
  if (!map.has(b)) map.set(b, new Set<number>());
  map.get(a)!.add(b);
  map.get(b)!.add(a);
}

/**
 * AIC（Alternating Inference Chain）基本形:
 * 候補ノード（cell,digit）で strong/weak を交互に辿り、
 * 同一 digit の両端候補が強連鎖で結べるとき、両端を同時に見るマスから当該 digit を削除する。
 *
 * 現実装は「同一 digit の端点削除」までを対象とする。
 */
export function tryAicStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);
  const maxEdges = 9;

  const strongAdj = new Map<number, Set<number>>();
  const weakAdj = new Map<number, Set<number>>();
  const allNodes: number[] = [];

  for (let cell = 0; cell < 81; cell++) {
    if (values[cell] !== 0) continue;
    const ds = bitList(getMask(cell));
    for (const d of ds) allNodes.push(nodeId(cell, d));

    // cell 内弱リンク（同時真不可）
    for (let i = 0; i < ds.length; i++) {
      for (let j = i + 1; j < ds.length; j++) {
        addUndirected(weakAdj, nodeId(cell, ds[i]!), nodeId(cell, ds[j]!));
      }
    }
    // bivalue cell 内強リンク
    if (ds.length === 2) {
      addUndirected(strongAdj, nodeId(cell, ds[0]!), nodeId(cell, ds[1]!));
    }
  }

  const houses: readonly (readonly number[])[] = [
    ...Array.from({ length: 9 }, (_, r) => sudokuRowCellIndices(r)),
    ...Array.from({ length: 9 }, (_, c) => sudokuColCellIndices(c)),
    ...Array.from({ length: 9 }, (_, b) => sudokuBlockCellIndices(b)),
  ];

  for (let digit = 1; digit <= 9; digit++) {
    for (const house of houses) {
      const candCells = house.filter((cell) => (getMask(cell) & (1 << (digit - 1))) !== 0);
      for (let i = 0; i < candCells.length; i++) {
        for (let j = i + 1; j < candCells.length; j++) {
          addUndirected(
            weakAdj,
            nodeId(candCells[i]!, digit),
            nodeId(candCells[j]!, digit),
          );
        }
      }
      if (candCells.length === 2) {
        addUndirected(
          strongAdj,
          nodeId(candCells[0]!, digit),
          nodeId(candCells[1]!, digit),
        );
      }
    }
  }

  for (const start of allNodes) {
    const firstStrong = strongAdj.get(start);
    if (!firstStrong || firstStrong.size === 0) continue;

    for (const next of firstStrong) {
      const path = [start, next];
      const used = new Set<number>(path);

      const dfs = (
        current: number,
        expect: EdgeType,
        edgeCount: number,
      ): TechniqueApplyResult | null => {
        // S-W-S ... -S で同一digit終端なら削除
        if (edgeCount >= 3 && edgeCount % 2 === 1) {
          const d1 = nodeDigit(start);
          const d2 = nodeDigit(current);
          const c1 = nodeCell(start);
          const c2 = nodeCell(current);
          if (d1 === d2 && c1 !== c2) {
            const bit = 1 << (d1 - 1);
            const skipCells = Array.from(new Set(path.map(nodeCell)));
            const hit = applyEliminationSeeingBothEnds(
              grid,
              values,
              getMask,
              c1,
              c2,
              bit,
              skipCells,
            );
            if (hit) return hit;
          }
        }
        if (edgeCount >= maxEdges) return null;

        const adj = expect === "strong" ? strongAdj : weakAdj;
        const neighbors = adj.get(current);
        if (!neighbors || neighbors.size === 0) return null;

        for (const to of neighbors) {
          if (used.has(to)) continue;
          used.add(to);
          path.push(to);
          const out = dfs(
            to,
            expect === "strong" ? "weak" : "strong",
            edgeCount + 1,
          );
          if (out) return out;
          path.pop();
          used.delete(to);
        }
        return null;
      };

      const hit = dfs(next, "weak", 1);
      if (hit) return hit;
    }
  }

  return null;
}
