import {
  hasEmptyCellWithoutMemo,
  makeGetMask,
  popcount9,
} from "@/lib/algorithms/techniques/helper";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueApplyResult } from "@/lib/types/sudoku_technique_types";

/** 9×9 で基本魚として意味のあるサイズ（N=9 は「全行／全列」になり削除が起きない）。 */
type FishSize = 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** `0..8` から `n` 個を昇順に選ぶ組み合わせを辞書順で列挙する。 */
function forEachCombination9(
  n: number,
  visit: (indices: readonly number[]) => void,
): void {
  if (n < 0 || n > 9) return;
  const pick: number[] = [];
  const rec = (start: number, depth: number) => {
    if (depth === n) {
      visit(pick.slice());
      return;
    }
    for (let i = start; i <= 9 - (n - depth); i++) {
      pick.push(i);
      rec(i + 1, depth + 1);
      pick.pop();
    }
  };
  rec(0, 0);
}

/**
 * 単一数字の基本魚（行 N 本に digit の候補がちょうど N 列にだけ載る → それらの列の他行から digit を削除）。
 * 列バージョンは対称。
 *
 * 空マスでメモ未入力が 1 つでもあれば実行しない。
 * 1 回の適用では、数字 → 行の組 → 列の組の順で最初の削除だけを行う（ポインティング以降と同方針）。
 */
function tryBasicFishStepOfSize(
  grid: SudokuGrid,
  n: FishSize,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;

  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  const tryRowFish = (): TechniqueApplyResult | null => {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);
      let result: TechniqueApplyResult | null = null;
      forEachCombination9(n, (rows) => {
        if (result !== null) return;

        let colBits = 0;
        for (const r of rows) {
          for (let c = 0; c < 9; c++) {
            const idx = r * 9 + c;
            if (getMask(idx) & bit) colBits |= 1 << c;
          }
        }

        if (popcount9(colBits) !== n) return;

        for (const r of rows) {
          let rowHasDigit = false;
          for (let c = 0; c < 9; c++) {
            const idx = r * 9 + c;
            if (getMask(idx) & bit) {
              rowHasDigit = true;
              if ((colBits & (1 << c)) === 0) return;
            }
          }
          if (!rowHasDigit) return;
        }

        const elimBitsByCell = new Array<number>(81).fill(0);
        const inRow = new Array<boolean>(9).fill(false);
        for (const r of rows) inRow[r] = true;

        for (let c = 0; c < 9; c++) {
          if ((colBits & (1 << c)) === 0) continue;
          for (let r = 0; r < 9; r++) {
            if (inRow[r]) continue;
            const idx = r * 9 + c;
            if (values[idx] !== 0) continue;
            if (getMask(idx) & bit) elimBitsByCell[idx] |= bit;
          }
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

        if (changedCells.length > 0) {
          result = {
            cellIndex: changedCells,
            grid: SudokuGrid.fromValuesAndCandidateMasks(values, nextMasks),
          };
        }
      });
      if (result !== null) return result;
    }
    return null;
  };

  const tryColFish = (): TechniqueApplyResult | null => {
    for (let digit = 1; digit <= 9; digit++) {
      const bit = 1 << (digit - 1);
      let result: TechniqueApplyResult | null = null;
      forEachCombination9(n, (cols) => {
        if (result !== null) return;

        let rowBits = 0;
        for (const c of cols) {
          for (let r = 0; r < 9; r++) {
            const idx = r * 9 + c;
            if (getMask(idx) & bit) rowBits |= 1 << r;
          }
        }

        if (popcount9(rowBits) !== n) return;

        for (const c of cols) {
          let colHasDigit = false;
          for (let r = 0; r < 9; r++) {
            const idx = r * 9 + c;
            if (getMask(idx) & bit) {
              colHasDigit = true;
              if ((rowBits & (1 << r)) === 0) return;
            }
          }
          if (!colHasDigit) return;
        }

        const elimBitsByCell = new Array<number>(81).fill(0);
        const inCol = new Array<boolean>(9).fill(false);
        for (const c of cols) inCol[c] = true;

        for (let r = 0; r < 9; r++) {
          if ((rowBits & (1 << r)) === 0) continue;
          for (let c = 0; c < 9; c++) {
            if (inCol[c]) continue;
            const idx = r * 9 + c;
            if (values[idx] !== 0) continue;
            if (getMask(idx) & bit) elimBitsByCell[idx] |= bit;
          }
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

        if (changedCells.length > 0) {
          result = {
            cellIndex: changedCells,
            grid: SudokuGrid.fromValuesAndCandidateMasks(values, nextMasks),
          };
        }
      });
      if (result !== null) return result;
    }
    return null;
  };

  return tryRowFish() ?? tryColFish();
}

/** fish22（別名 X-Wing）。 */
export function tryFish22Step(grid: SudokuGrid): TechniqueApplyResult | null {
  return tryBasicFishStepOfSize(grid, 2);
}

/** fish33（別名 Swordfish）。 */
export function tryFish33Step(grid: SudokuGrid): TechniqueApplyResult | null {
  return tryBasicFishStepOfSize(grid, 3);
}

/** fish44（別名 Jellyfish）。 */
export function tryFish44Step(grid: SudokuGrid): TechniqueApplyResult | null {
  return tryBasicFishStepOfSize(grid, 4);
}

/** fish55（基本魚 N=5。一般名はあまり固定されていない）。 */
export function tryFish55Step(grid: SudokuGrid): TechniqueApplyResult | null {
  return tryBasicFishStepOfSize(grid, 5);
}

/** fish66（基本魚 N=6）。 */
export function tryFish66Step(grid: SudokuGrid): TechniqueApplyResult | null {
  return tryBasicFishStepOfSize(grid, 6);
}

/** fish77（基本魚 N=7）。 */
export function tryFish77Step(grid: SudokuGrid): TechniqueApplyResult | null {
  return tryBasicFishStepOfSize(grid, 7);
}

/** fish88（基本魚 N=8）。 */
export function tryFish88Step(grid: SudokuGrid): TechniqueApplyResult | null {
  return tryBasicFishStepOfSize(grid, 8);
}
