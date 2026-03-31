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
import { sudokuPeerIndices } from "@/lib/validates/grid";

type Als = {
  cells: number[];
  unionMask: number;
  maskByCell: Map<number, number>;
};

function bitList(mask: number): number[] {
  const out: number[] = [];
  const m = mask & 0x1ff;
  for (let d = 1; d <= 9; d++) {
    const b = 1 << (d - 1);
    if ((m & b) !== 0) out.push(b);
  }
  return out;
}

function forEachCombination(
  indices: readonly number[],
  n: number,
  visit: (comb: readonly number[]) => void,
): void {
  const k = indices.length;
  if (n > k) return;
  const pick: number[] = [];
  const rec = (start: number, depth: number) => {
    if (depth === n) {
      visit(pick.slice());
      return;
    }
    for (let i = start; i <= k - (n - depth); i++) {
      pick.push(indices[i]!);
      rec(i + 1, depth + 1);
      pick.pop();
    }
  };
  rec(0, 0);
}

function areAllPeers(aCells: readonly number[], bCells: readonly number[]): boolean {
  for (const a of aCells) {
    const peersA = new Set(sudokuPeerIndices(a));
    for (const b of bCells) {
      if (!peersA.has(b)) return false;
    }
  }
  return true;
}

function buildAlsList(
  values: readonly number[],
  getMask: (cellIndex: number) => number,
): Als[] {
  const houses: readonly (readonly number[])[] = [
    ...Array.from({ length: 9 }, (_, r) => sudokuRowCellIndices(r)),
    ...Array.from({ length: 9 }, (_, c) => sudokuColCellIndices(c)),
    ...Array.from({ length: 9 }, (_, b) => sudokuBlockCellIndices(b)),
  ];

  const out: Als[] = [];
  for (const house of houses) {
    const empties = house.filter((i) => values[i] === 0 && getMask(i) !== 0);
    if (empties.length < 2) continue;

    // ALS は N セルに N+1 種類候補。サイズは 2〜4 を対象にする。
    for (const n of [2, 3, 4]) {
      let stop = false;
      forEachCombination(empties, n, (comb) => {
        if (stop) return;
        const maskByCell = new Map<number, number>();
        let unionMask = 0;
        for (const c of comb) {
          const m = getMask(c);
          if (m === 0) return;
          maskByCell.set(c, m);
          unionMask |= m;
        }
        if (popcount9(unionMask) !== n + 1) return;
        out.push({ cells: comb.slice(), unionMask, maskByCell });

        // 同一ハウスでの組み合わせ爆発を抑えるため、各サイズ最大 24 件まで。
        if (out.length >= 24 * houses.length) {
          stop = true;
        }
      });
      if (stop) break;
    }
  }
  return out;
}

/**
 * ALS-XZ（簡易一般形）:
 * 2 つの ALS が共通候補 X/Z を持ち、X が restricted common candidate（相互に全て peer）なら、
 * 共有候補 Z をそれぞれ持つ ALS の全 Z セルを同時に見るマスから Z を削除する。
 */
export function tryAlsXzStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);
  const alsList = buildAlsList(values, getMask);
  if (alsList.length < 2) return null;

  for (let i = 0; i < alsList.length; i++) {
    const a = alsList[i]!;
    const aCellSet = new Set(a.cells);
    for (let j = i + 1; j < alsList.length; j++) {
      const b = alsList[j]!;
      if (b.cells.some((c) => aCellSet.has(c))) continue;

      const commonMask = a.unionMask & b.unionMask;
      if (commonMask === 0) continue;
      const commonBits = bitList(commonMask);
      if (commonBits.length < 2) continue;

      for (const x of commonBits) {
        const xCellsA = a.cells.filter((c) => (a.maskByCell.get(c)! & x) !== 0);
        const xCellsB = b.cells.filter((c) => (b.maskByCell.get(c)! & x) !== 0);
        if (xCellsA.length === 0 || xCellsB.length === 0) continue;
        if (!areAllPeers(xCellsA, xCellsB)) continue; // RCC(X)

        for (const z of commonBits) {
          if (z === x) continue;
          const zCellsA = a.cells.filter((c) => (a.maskByCell.get(c)! & z) !== 0);
          const zCellsB = b.cells.filter((c) => (b.maskByCell.get(c)! & z) !== 0);
          if (zCellsA.length === 0 || zCellsB.length === 0) continue;

          const zCells = [...zCellsA, ...zCellsB];
          const zPeerSets = zCells.map((c) => new Set(sudokuPeerIndices(c)));
          const skip = new Set<number>([...a.cells, ...b.cells]);
          const elimBitsByCell = new Array<number>(81).fill(0);

          for (let cell = 0; cell < 81; cell++) {
            if (values[cell] !== 0) continue;
            if (skip.has(cell)) continue;
            if ((getMask(cell) & z) === 0) continue;
            if (!zPeerSets.every((s) => s.has(cell))) continue;
            elimBitsByCell[cell] |= z;
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
    }
  }

  return null;
}
