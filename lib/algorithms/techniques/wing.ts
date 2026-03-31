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

/** XY-Wing: pivot{xy}, wing1{xz}, wing2{yz} -> wing1/wing2 を同時に見るマスから z を削除 */
export function tryXYWingStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  for (let pivot = 0; pivot < 81; pivot++) {
    if (values[pivot] !== 0) continue;
    const pm = getMask(pivot);
    if (popcount9(pm) !== 2) continue;
    const pBits = bitList(pm);
    const x = pBits[0]!;
    const y = pBits[1]!;

    const peers = sudokuPeerIndices(pivot).filter((i) => i !== pivot);
    for (const w1 of peers) {
      if (values[w1] !== 0) continue;
      const m1 = getMask(w1);
      if (popcount9(m1) !== 2) continue;
      if ((m1 & x) === 0 || (m1 & y) !== 0) continue;
      const z = m1 & ~x;
      if (z === 0) continue;

      for (const w2 of peers) {
        if (w2 === w1) continue;
        if (values[w2] !== 0) continue;
        const m2 = getMask(w2);
        if (popcount9(m2) !== 2) continue;
        if ((m2 & y) === 0 || (m2 & x) !== 0) continue;
        if ((m2 & z) === 0) continue;

        const peers1 = new Set(sudokuPeerIndices(w1));
        const peers2 = new Set(sudokuPeerIndices(w2));
        const elimBitsByCell = new Array<number>(81).fill(0);
        for (let i = 0; i < 81; i++) {
          if (values[i] !== 0) continue;
          if (i === pivot || i === w1 || i === w2) continue;
          if (!peers1.has(i) || !peers2.has(i)) continue;
          if (getMask(i) & z) elimBitsByCell[i] |= z;
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
  return null;
}

/** XYZ-Wing: pivot{xyz}, wing1{xz}, wing2{yz} -> pivot/wing1/wing2 を同時に見るマスから z を削除 */
export function tryXYZWingStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  for (let pivot = 0; pivot < 81; pivot++) {
    if (values[pivot] !== 0) continue;
    const pm = getMask(pivot);
    if (popcount9(pm) !== 3) continue;
    const pBits = bitList(pm);

    for (const z of pBits) {
      const others = pBits.filter((b) => b !== z);
      if (others.length !== 2) continue;
      const need1 = z | others[0]!;
      const need2 = z | others[1]!;

      const peers = sudokuPeerIndices(pivot).filter((i) => i !== pivot);
      const wing1List = peers.filter(
        (i) => values[i] === 0 && getMask(i) === need1,
      );
      const wing2List = peers.filter(
        (i) => values[i] === 0 && getMask(i) === need2,
      );

      for (const w1 of wing1List) {
        for (const w2 of wing2List) {
          if (w1 === w2) continue;
          const peersP = new Set(sudokuPeerIndices(pivot));
          const peers1 = new Set(sudokuPeerIndices(w1));
          const peers2 = new Set(sudokuPeerIndices(w2));
          const elimBitsByCell = new Array<number>(81).fill(0);
          for (let i = 0; i < 81; i++) {
            if (values[i] !== 0) continue;
            if (i === pivot || i === w1 || i === w2) continue;
            if (!peersP.has(i) || !peers1.has(i) || !peers2.has(i)) continue;
            if (getMask(i) & z) elimBitsByCell[i] |= z;
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

/**
 * WXYZ-Wing（ALS 的実装）:
 * 単一ハウス内 4 マスの候補和集合が 4 種類で、ある候補 r が 2 マスにだけ現れる（restricted）とき、
 * 他候補 d について d を含む全マスを同時に見るセルから d を削除する。
 */
export function tryWXYZWingStep(
  grid: SudokuGrid,
): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  const houses: readonly (readonly number[])[] = [
    ...Array.from({ length: 9 }, (_, r) => sudokuRowCellIndices(r)),
    ...Array.from({ length: 9 }, (_, c) => sudokuColCellIndices(c)),
    ...Array.from({ length: 9 }, (_, b) => sudokuBlockCellIndices(b)),
  ];

  for (const house of houses) {
    const empties = house.filter((i) => values[i] === 0 && getMask(i) !== 0);
    if (empties.length < 4) continue;

    let hit: TechniqueApplyResult | null = null;
    forEachCombination(empties, 4, (comb) => {
      if (hit) return;

      let union = 0;
      const masks = comb.map((i) => getMask(i));
      for (const m of masks) union |= m;
      if (popcount9(union) !== 4) return;

      const unionBits = bitList(union);
      for (const restricted of unionBits) {
        const restrictedCells = comb.filter((i) => (getMask(i) & restricted) !== 0);
        if (restrictedCells.length !== 2) continue;

        for (const d of unionBits) {
          if (d === restricted) continue;
          const dCells = comb.filter((i) => (getMask(i) & d) !== 0);
          if (dCells.length < 2) continue;

          const peerSets = dCells.map((i) => new Set(sudokuPeerIndices(i)));
          const commonPeers: number[] = [];
          for (let i = 0; i < 81; i++) {
            if (comb.includes(i)) continue;
            if (values[i] !== 0) continue;
            if (peerSets.every((s) => s.has(i))) commonPeers.push(i);
          }
          if (commonPeers.length === 0) continue;

          const elimBitsByCell = new Array<number>(81).fill(0);
          for (const i of commonPeers) {
            if (getMask(i) & d) elimBitsByCell[i] |= d;
          }

          hit = buildTechniqueResultFromElimBits(
            grid,
            values,
            getMask,
            elimBitsByCell,
          );
          if (hit) return;
        }
      }
    });
    if (hit) return hit;
  }

  return null;
}

/**
 * W-Wing:
 * 同じ二値 {x,y} の 2 マス A/B（非ピア）と、digit x の強リンク C-D を使う。
 * C が A を見て D が B を見る（または逆）なら、A/B の少なくとも一方が y となるため、
 * A と B を同時に見るマスから y を削除する。
 */
export function tryWWingStep(grid: SudokuGrid): TechniqueApplyResult | null {
  if (hasEmptyCellWithoutMemo(grid)) return null;
  const values = [...grid.values()];
  const getMask = makeGetMask(values, grid);

  const bivalueCells: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0) continue;
    if (popcount9(getMask(i)) === 2) bivalueCells.push(i);
  }

  const strongLinksByDigit: Array<Array<readonly [number, number]>> = Array.from(
    { length: 9 },
    () => [],
  );
  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);
    const links: Array<readonly [number, number]> = [];
    for (let r = 0; r < 9; r++) {
      const cand = sudokuRowCellIndices(r).filter((i) => (getMask(i) & bit) !== 0);
      if (cand.length === 2) links.push([cand[0]!, cand[1]!]);
    }
    for (let c = 0; c < 9; c++) {
      const cand = sudokuColCellIndices(c).filter((i) => (getMask(i) & bit) !== 0);
      if (cand.length === 2) links.push([cand[0]!, cand[1]!]);
    }
    for (let b = 0; b < 9; b++) {
      const cand = sudokuBlockCellIndices(b).filter((i) => (getMask(i) & bit) !== 0);
      if (cand.length === 2) links.push([cand[0]!, cand[1]!]);
    }
    strongLinksByDigit[digit - 1] = links;
  }

  for (let ia = 0; ia < bivalueCells.length; ia++) {
    const a = bivalueCells[ia]!;
    const ma = getMask(a);
    for (let ib = ia + 1; ib < bivalueCells.length; ib++) {
      const b = bivalueCells[ib]!;
      if (ma !== getMask(b)) continue;
      const peersA = new Set(sudokuPeerIndices(a));
      if (peersA.has(b)) continue; // non-peer pair only

      const bits = bitList(ma);
      const x = bits[0]!;
      const y = bits[1]!;
      const xDigit = Math.log2(x) + 1;
      const links = strongLinksByDigit[xDigit - 1]!;
      const peersB = new Set(sudokuPeerIndices(b));

      let linkFound = false;
      for (const [c1, c2] of links) {
        if (c1 === a || c1 === b || c2 === a || c2 === b) continue;
        const direct = peersA.has(c1) && peersB.has(c2);
        const reverse = peersA.has(c2) && peersB.has(c1);
        if (direct || reverse) {
          linkFound = true;
          break;
        }
      }
      if (!linkFound) continue;

      const elimBitsByCell = new Array<number>(81).fill(0);
      for (let i = 0; i < 81; i++) {
        if (values[i] !== 0) continue;
        if (i === a || i === b) continue;
        if (!peersA.has(i) || !peersB.has(i)) continue;
        if (getMask(i) & y) elimBitsByCell[i] |= y;
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

  return null;
}
