import {
  buildTechniqueResultFromElimBits,
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

function rowOf(i: number): number {
  return Math.floor(i / 9);
}

function colOf(i: number): number {
  return i % 9;
}

function blockOf(i: number): number {
  return Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
}

/**
 * X-Cycle（単一数字）:
 * strong/weak の交互連鎖で閉路（nice loop）を作る。
 * - continuous loop: 弱リンク辺は実質強リンクとして扱え、共有ハウスの他セルから候補削除
 * - discontinuous loop（弱-弱）: そのノードから当該数字候補を削除
 */
export function tryXCycleStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);
  const maxCycleEdges = 9;

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

    for (const a of candidateCells) {
      for (const b of sudokuPeerIndices(a)) {
        if (b <= a) continue;
        if (values[b] !== 0) continue;
        if ((getMask(b) & bit) === 0) continue;
        const s = strongAdj.get(a);
        if (s?.has(b)) continue;
        addUndirected(weakAdj, a, b);
      }
    }

    let discontinuousFallback: TechniqueApplyResult | null = null;

    for (const start of candidateCells) {
      for (const firstType of ["strong", "weak"] as const) {
        const pathNodes = [start];
        const pathEdges: EdgeType[] = [];
        const used = new Set<number>(pathNodes);

        const dfs = (
          current: number,
          expect: EdgeType,
          edgesUsed: number,
        ): TechniqueApplyResult | null => {
          if (edgesUsed >= maxCycleEdges) return null;
          const adj = expect === "strong" ? strongAdj : weakAdj;
          const neighbors = adj.get(current);
          if (!neighbors || neighbors.size === 0) return null;

          for (const to of neighbors) {
            if (to === start) {
              if (edgesUsed + 1 < 4) continue;
              pathEdges.push(expect);

              // cycle nodes order: pathNodes[0..n-1], back to start
              const n = pathNodes.length;
              const elimBitsByCell = new Array<number>(81).fill(0);
              let hasDiscontinuous = false;
              for (let i = 0; i < n; i++) {
                const prevEdge = pathEdges[(i - 1 + n) % n]!;
                const nextEdge = pathEdges[i]!;
                if (prevEdge === "weak" && nextEdge === "weak") {
                  hasDiscontinuous = true;
                  const cell = pathNodes[i]!;
                  if (getMask(cell) & bit) elimBitsByCell[cell] |= bit;
                }
              }

              // continuous loop のとき、弱リンク辺は強リンクとして扱える。
              // よって、その弱リンク 2 端点が共有するハウス内の他セルから候補を削除する。
              if (!hasDiscontinuous) {
                for (let i = 0; i < n; i++) {
                  if (pathEdges[i] !== "weak") continue;
                  const a = pathNodes[i]!;
                  const b = pathNodes[(i + 1) % n]!;
                  const sharedRows = rowOf(a) === rowOf(b);
                  const sharedCols = colOf(a) === colOf(b);
                  const sharedBlocks = blockOf(a) === blockOf(b);

                  for (let cell = 0; cell < 81; cell++) {
                    if (cell === a || cell === b) continue;
                    if (values[cell] !== 0) continue;
                    if ((getMask(cell) & bit) === 0) continue;

                    const sameSharedRow = sharedRows && rowOf(cell) === rowOf(a);
                    const sameSharedCol = sharedCols && colOf(cell) === colOf(a);
                    const sameSharedBlock = sharedBlocks && blockOf(cell) === blockOf(a);
                    if (!sameSharedRow && !sameSharedCol && !sameSharedBlock) continue;

                    elimBitsByCell[cell] |= bit;
                  }
                }
              }

              const hit = buildTechniqueResultFromElimBits(
                grid,
                values,
                getMask,
                elimBitsByCell,
              );
              pathEdges.pop();
              if (hit) {
                if (!hasDiscontinuous) return hit;
                if (!discontinuousFallback) discontinuousFallback = hit;
              }
              continue;
            }

            if (used.has(to)) continue;
            used.add(to);
            pathNodes.push(to);
            pathEdges.push(expect);

            const out = dfs(to, expect === "strong" ? "weak" : "strong", edgesUsed + 1);
            if (out) return out;

            pathEdges.pop();
            pathNodes.pop();
            used.delete(to);
          }
          return null;
        };

        const hit = dfs(start, firstType, 0);
        if (hit) return hit;
      }
    }
    if (discontinuousFallback) return discontinuousFallback;
  }

  return null;
}
