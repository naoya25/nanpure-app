import {
  ALL_CANDIDATE_BITS,
  popcount9,
  sudokuBlockCellIndices,
  sudokuColCellIndices,
  sudokuRowCellIndices,
} from "@/lib/algorithms/techniques/helper";
import { tryPencilMarkStep } from "@/lib/algorithms/techniques/pencil_mark";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { sudokuPeerIndices } from "@/lib/validates/grid";

/** ペア(2) / トリプル(3) / クァッド(4)。ユニット内の n マスで候補の和集合がちょうど n 種類 → 他マスからその n 数字の候補を削除。 */
type SubsetSize = 2 | 3 | 4;

function makeGetMask(values: readonly number[], grid: SudokuGrid) {
  return (cellIndex: number): number => {
    if (values[cellIndex] !== 0) return 0;

    let usedMask = 0;
    for (const j of sudokuPeerIndices(cellIndex)) {
      if (j === cellIndex) continue;
      const v = values[j] ?? 0;
      if (v === 0) continue;
      usedMask |= 1 << (v - 1);
    }

    let candidateMask = ALL_CANDIDATE_BITS & ~usedMask;
    const memoMask = grid.cellAt(cellIndex).memoMask;
    if (memoMask !== 0) candidateMask &= memoMask;
    return candidateMask;
  };
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

function trySubsetEliminationAfterPencil(
  grid: SudokuGrid,
  subsetSize: SubsetSize,
): TechniqueApplyResult | null {
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);
  const elimBitsByCell = new Array<number>(81).fill(0);

  const scanUnit = (unitIndices: readonly number[]) => {
    const empties: number[] = [];
    for (const i of unitIndices) {
      if (values[i] !== 0) continue;
      const m = getMask(i);
      if (m === 0) continue;
      empties.push(i);
    }
    if (empties.length < subsetSize) return;

    forEachCombination(empties, subsetSize, (comb) => {
      let union = 0;
      for (const i of comb) union |= getMask(i);
      if (popcount9(union) !== subsetSize) return;
      for (const i of comb) {
        if ((getMask(i) & ~union) !== 0) return;
      }
      const combSet = new Set(comb);
      for (const i of unitIndices) {
        if (values[i] !== 0) continue;
        if (combSet.has(i)) continue;
        const m = getMask(i);
        const overlap = m & union;
        if (overlap !== 0) elimBitsByCell[i] |= overlap;
      }
    });
  };

  for (let r = 0; r < 9; r++) scanUnit(sudokuRowCellIndices(r));
  for (let c = 0; c < 9; c++) scanUnit(sudokuColCellIndices(c));
  for (let b = 0; b < 9; b++) scanUnit(sudokuBlockCellIndices(b));

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

function trySubsetStep(
  grid: SudokuGrid,
  subsetSize: SubsetSize,
): TechniqueApplyResult | null {
  const pencilRes = tryPencilMarkStep(grid);
  const work = pencilRes?.grid ?? grid;
  const subsetRes = trySubsetEliminationAfterPencil(work, subsetSize);
  if (subsetRes) {
    const cellIndex =
      pencilRes && pencilRes.cellIndex.length > 0
        ? [...new Set([...pencilRes.cellIndex, ...subsetRes.cellIndex])]
        : subsetRes.cellIndex;
    return { cellIndex, grid: subsetRes.grid };
  }
  return pencilRes ?? null;
}

/** ペア（ユニット内 2 マス・2 種類の候補にロック → 他マスからその 2 数字を削除）。 */
export function tryPairStep(grid: SudokuGrid): TechniqueApplyResult | null {
  return trySubsetStep(grid, 2);
}

/** トリプル（3 マス・3 種類）。 */
export function tryTripleStep(grid: SudokuGrid): TechniqueApplyResult | null {
  return trySubsetStep(grid, 3);
}

/** クァッド（4 マス・4 種類）。 */
export function tryQuadStep(grid: SudokuGrid): TechniqueApplyResult | null {
  return trySubsetStep(grid, 4);
}
