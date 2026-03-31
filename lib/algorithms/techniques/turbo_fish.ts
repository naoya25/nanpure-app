import {
  hasEmptyCellWithoutMemo,
  makeGetMask,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { sudokuPeerIndices } from "@/lib/validates/grid";

type HouseKind = "row" | "col" | "block";
type StrongLink = {
  kind: HouseKind;
  house: number;
  a: number;
  b: number;
};

function sharesAnyHouse(i: number, j: number): boolean {
  const r1 = Math.floor(i / 9);
  const c1 = i % 9;
  const r2 = Math.floor(j / 9);
  const c2 = j % 9;
  if (r1 === r2 || c1 === c2) return true;
  return Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3);
}

function buildStrongLinksForDigit(
  bit: number,
  getMask: (i: number) => number,
): StrongLink[] {
  const out: StrongLink[] = [];

  for (let row = 0; row < 9; row++) {
    const cand = sudokuRowCellIndices(row).filter((i) => (getMask(i) & bit) !== 0);
    if (cand.length === 2) out.push({ kind: "row", house: row, a: cand[0]!, b: cand[1]! });
  }
  for (let col = 0; col < 9; col++) {
    const cand = sudokuColCellIndices(col).filter((i) => (getMask(i) & bit) !== 0);
    if (cand.length === 2) out.push({ kind: "col", house: col, a: cand[0]!, b: cand[1]! });
  }
  for (let block = 0; block < 9; block++) {
    const cand = sudokuBlockCellIndices(block).filter((i) => (getMask(i) & bit) !== 0);
    if (cand.length === 2) out.push({ kind: "block", house: block, a: cand[0]!, b: cand[1]! });
  }

  return out;
}

function applyEliminationSeeingBothEnds(
  grid: SudokuGrid,
  values: readonly number[],
  getMask: (i: number) => number,
  end1: number,
  end2: number,
  bit: number,
  chainCells: readonly number[],
): TechniqueApplyResult | null {
  const peers1 = new Set(sudokuPeerIndices(end1));
  const peers2 = new Set(sudokuPeerIndices(end2));
  const skip = new Set<number>(chainCells);

  const elimBitsByCell = new Array<number>(81).fill(0);
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    if (skip.has(i)) continue;
    if (!peers1.has(i) || !peers2.has(i)) continue;
    if (getMask(i) & bit) elimBitsByCell[i] |= bit;
  }

  const nextMasks = Array.from({ length: 81 }, (_, i) => {
    if (values[i] !== 0) return 0;
    return getMask(i) & ~elimBitsByCell[i]!;
  });

  const changedCells: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    const prev = grid.cellAt(i).memoMask & 0x1ff;
    if (nextMasks[i]! !== prev) changedCells.push(i);
  }

  if (changedCells.length === 0) return null;
  return {
    cellIndex: changedCells,
    grid: SudokuGrid.fromValuesAndCandidateMasks(values, nextMasks),
  };
}

/**
 * ターボフィッシュ（Turbot Fish）一般形（単一数字）
 *
 * 4 セル鎖 A-B-C-D で、A-B と C-D が強リンク、B-C が弱リンク（同一ハウスで同時真になれない）。
 * このとき A と D の少なくとも一方は真になるため、A と D を同時に見るセルから数字候補を削除する。
 *
 * 実装上は、強リンクを row/col/block すべてで列挙し、弱リンクは「同一 row/col/block 共有」で判定する。
 */
export function tryTurboFishStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);
    const strongLinks = buildStrongLinksForDigit(bit, getMask);

    for (let i = 0; i < strongLinks.length; i++) {
      const l1 = strongLinks[i]!;
      for (let j = 0; j < strongLinks.length; j++) {
        if (i === j) continue;
        const l2 = strongLinks[j]!;

        const l1Choices: ReadonlyArray<readonly [number, number]> = [
          [l1.a, l1.b],
          [l1.b, l1.a],
        ];
        const l2Choices: ReadonlyArray<readonly [number, number]> = [
          [l2.a, l2.b],
          [l2.b, l2.a],
        ];

        for (const [end1, mid1] of l1Choices) {
          for (const [mid2, end2] of l2Choices) {
            if (end1 === end2) continue;
            if (mid1 === mid2) continue;
            if (!sharesAnyHouse(mid1, mid2)) continue; // weak link

            const hit = applyEliminationSeeingBothEnds(
              grid,
              values,
              getMask,
              end1,
              end2,
              bit,
              [end1, mid1, mid2, end2],
            );
            if (hit) return hit;
          }
        }
      }
    }
  }

  return null;
}
