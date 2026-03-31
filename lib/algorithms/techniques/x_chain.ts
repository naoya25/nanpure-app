import {
  applyEliminationSeeingBothEnds,
  hasEmptyCellWithoutMemo,
  makeGetMask,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { sudokuPeerIndices } from "@/lib/validates/grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

type EdgeType = "strong" | "weak";

function addUndirected(
  map: Map<number, Set<number>>,
  a: number,
  b: number,
): void {
  if (a === b) return;
  if (!map.has(a)) map.set(a, new Set<number>());
  if (!map.has(b)) map.set(b, new Set<number>());
  map.get(a)!.add(b);
  map.get(b)!.add(a);
}

/**
 * X-Chain（単一数字）
 *
 * 同一数字候補セルをノードとし、強リンク・弱リンクを交互に辿る。
 * 「強リンクで始まり強リンクで終わる」連鎖が見つかったら、
 * 端点を同時に見るセルからその数字候補を削除する。
 */
export function tryXChainStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);
  const maxEdges = 7; // S-W-S を基底に、やや長い連鎖まで見る

  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);

    const candidateCells: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (values[i] !== 0) continue;
      if ((getMask(i) & bit) !== 0) candidateCells.push(i);
    }
    if (candidateCells.length < 4) continue;

    const strongAdj = new Map<number, Set<number>>();
    const weakAdj = new Map<number, Set<number>>();

    // 強リンク（行・列・ブロックの共役ペア）
    for (let row = 0; row < 9; row++) {
      const cand = sudokuRowCellIndices(row).filter((i) => (getMask(i) & bit) !== 0);
      if (cand.length === 2) addUndirected(strongAdj, cand[0]!, cand[1]!);
    }
    for (let col = 0; col < 9; col++) {
      const cand = sudokuColCellIndices(col).filter((i) => (getMask(i) & bit) !== 0);
      if (cand.length === 2) addUndirected(strongAdj, cand[0]!, cand[1]!);
    }
    for (let block = 0; block < 9; block++) {
      const cand = sudokuBlockCellIndices(block).filter((i) => (getMask(i) & bit) !== 0);
      if (cand.length === 2) addUndirected(strongAdj, cand[0]!, cand[1]!);
    }

    // 弱リンク（同一ハウスにある同数字候補セル同士）
    // 強リンクと同じペアは除外し、連鎖の型を保つ。
    for (const a of candidateCells) {
      const peers = sudokuPeerIndices(a);
      for (const b of peers) {
        if (b <= a) continue;
        if (values[b] !== 0) continue;
        if ((getMask(b) & bit) === 0) continue;
        const strongNeighbors = strongAdj.get(a);
        if (strongNeighbors?.has(b)) continue;
        addUndirected(weakAdj, a, b);
      }
    }

    for (const start of candidateCells) {
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
          // 強リンク終端（S-W-S...-S）なら端点削除を試す
          if (edgeCount >= 3 && edgeCount % 2 === 1) {
            const hit = applyEliminationSeeingBothEnds(
              grid,
              values,
              getMask,
              start,
              current,
              bit,
              path,
            );
            if (hit) return hit;
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
  }

  return null;
}
