import {
  buildTechniqueResultFromElimBits,
  hasEmptyCellWithoutMemo,
  makeGetMask,
  popcount9,
  SUDOKU_UNITS,
} from "@/lib/algorithms/techniques/helper";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";
import { SUDOKU_CELLS, sudokuPeerIndices } from "@/lib/validates/grid";

const PEERS: readonly (readonly number[])[] = Array.from(
  { length: SUDOKU_CELLS },
  (_, i) => sudokuPeerIndices(i).filter((j) => j !== i),
);

function placeDigitOrFail(
  values: Uint8Array,
  masks: Uint16Array,
  cell: number,
  digit: number,
): boolean {
  const bit = 1 << (digit - 1);
  if ((masks[cell]! & bit) === 0) return false;
  values[cell] = digit;
  masks[cell] = 0;
  for (const j of PEERS[cell]!) {
    if (values[j] === digit) return false;
    if (values[j] !== 0) continue;
    masks[j] = masks[j]! & ~bit;
    if (masks[j] === 0) return false;
  }
  return true;
}

function propagateSinglesFindsContradiction(
  values: Uint8Array,
  masks: Uint16Array,
): boolean {
  for (;;) {
    let progressed = false;

    for (let i = 0; i < SUDOKU_CELLS; i++) {
      if (values[i] !== 0) continue;
      const m = masks[i]!;
      if (m === 0) return true;
      if ((m & (m - 1)) === 0) {
        if (!placeDigitOrFail(values, masks, i, 32 - Math.clz32(m))) return true;
        progressed = true;
      }
    }

    for (const unit of SUDOKU_UNITS) {
      let placed = 0;
      for (const i of unit) {
        if (values[i] !== 0) placed |= 1 << (values[i]! - 1);
      }
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << (d - 1);
        if ((placed & bit) !== 0) continue;
        let count = 0;
        let only = -1;
        for (const i of unit) {
          if (values[i] === 0 && (masks[i]! & bit) !== 0) {
            count += 1;
            only = i;
          }
        }
        if (count === 0) return true;
        if (count === 1) {
          if (!placeDigitOrFail(values, masks, only, d)) return true;
          placed |= bit;
          progressed = true;
        }
      }
    }

    if (!progressed) return false;
  }
}

function hasDuplicateValueInUnit(values: Uint8Array): boolean {
  for (const unit of SUDOKU_UNITS) {
    let placed = 0;
    for (const i of unit) {
      const v = values[i]!;
      if (v === 0) continue;
      const bit = 1 << (v - 1);
      if ((placed & bit) !== 0) return true;
      placed |= bit;
    }
  }
  return false;
}

/**
 * 仮置き（1 段）: 候補を 1 つ仮に置いてシングル・隠れシングルだけで進め、
 * 矛盾が出たらその候補を削除する。1 手で削除するのは 1 候補だけ。
 */
export function tryTrialAndErrorStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);
  const baseValues = Uint8Array.from(values);
  const baseMasks = Uint16Array.from(values, (v, i) => (v === 0 ? getMask(i) : 0));

  // 元の盤が矛盾していると、どの仮置きでも矛盾が出て正解の候補まで消してしまう
  if (hasDuplicateValueInUnit(baseValues)) return null;
  if (
    propagateSinglesFindsContradiction(
      Uint8Array.from(baseValues),
      Uint16Array.from(baseMasks),
    )
  ) {
    return null;
  }

  const emptyCells: number[] = [];
  for (let i = 0; i < SUDOKU_CELLS; i++) {
    if (values[i] === 0) emptyCells.push(i);
  }
  emptyCells.sort(
    (a, b) => popcount9(baseMasks[a]!) - popcount9(baseMasks[b]!) || a - b,
  );

  for (const cell of emptyCells) {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);
      if ((baseMasks[cell]! & bit) === 0) continue;

      const trialValues = Uint8Array.from(baseValues);
      const trialMasks = Uint16Array.from(baseMasks);
      const contradiction =
        !placeDigitOrFail(trialValues, trialMasks, cell, digit) ||
        propagateSinglesFindsContradiction(trialValues, trialMasks);
      if (!contradiction) continue;

      const elimBitsByCell = new Array<number>(SUDOKU_CELLS).fill(0);
      elimBitsByCell[cell] = bit;
      return buildTechniqueResultFromElimBits(grid, values, getMask, elimBitsByCell);
    }
  }

  return null;
}
