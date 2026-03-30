import { SUDOKU_CELLS } from "@/lib/validates/grid";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

function countZeros(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "0") n++;
  }
  return n;
}

/** 行 `row`（0〜8）の 9 文字 */
function rowSlice(s: string, row: number): string {
  const start = row * 9;
  return s.slice(start, start + 9);
}

/** 列 `col`（0〜8）の 9 文字を配列で */
function colChars(s: string, col: number): string[] {
  const out: string[] = [];
  for (let j = 0; j < 9; j++) {
    out.push(s[col + 9 * j]);
  }
  return out;
}

/** マス `index` が属する 3×3 ブロックの 9 文字を配列で */
function boxChars(s: string, index: number): string[] {
  const top = Math.floor(index / 27) * 27 + Math.floor((index % 9) / 3) * 3;
  const out: string[] = [];
  for (let j = 0; j < 9; j++) {
    out.push(s[top + Math.floor(j / 3) * 9 + (j % 3)]);
  }
  return out;
}

/** ブロック番号 `block`（0〜8、左→右・上→下）の 9 文字を配列で */
function blockCharsByBlockIndex(s: string, block: number): string[] {
  const top = Math.floor(block / 3) * 27 + (block % 3) * 3;
  const out: string[] = [];
  for (let j = 0; j < 9; j++) {
    out.push(s[top + Math.floor(j / 3) * 9 + (j % 3)]);
  }
  return out;
}

function hasDuplicateDigit1To9(cells: readonly string[]): boolean {
  for (let d = 1; d <= 9; d++) {
    const ch = String(d);
    let c = 0;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] === ch) c += 1;
    }
    if (c > 1) return true;
  }
  return false;
}

/**
 * 盤全体について、行・列・3×3 それぞれで 1〜9 の重複がないか（`0` は複数可）。
 */
export function sudokuCheckAll(puzzle81: string): boolean {
  if (puzzle81.length !== SUDOKU_CELLS) return false;

  for (let i = 0; i < 9; i++) {
    const ss = rowSlice(puzzle81, i);
    if (hasDuplicateDigit1To9([...ss])) return false;
  }

  for (let i = 0; i < 9; i++) {
    const ss = colChars(puzzle81, i);
    if (hasDuplicateDigit1To9(ss)) return false;
  }

  for (let i = 0; i < 9; i++) {
    const ss = blockCharsByBlockIndex(puzzle81, i);
    if (hasDuplicateDigit1To9(ss)) return false;
  }

  return true;
}

export type FindNextResult = {
  index: number;
  options: string[];
};

/**
 * 空マスのうち、行・列・ブロックに既に現れる数字が最も多いマスを選び、
 * そこに入れうる数字の集合を返す。
 */
export function sudokuFindNext(puzzle81: string): FindNextResult | null {
  if (puzzle81.length !== SUDOKU_CELLS) return null;
  if (!puzzle81.includes("0")) return null;

  let bestK = 0;
  let maxN = 0;
  let cannotSet = new Set<string>();

  for (let k = 0; k < SUDOKU_CELLS; k++) {
    if (puzzle81[k] !== "0") continue;

    const rArr = [...rowSlice(puzzle81, Math.floor(k / 9))];
    const cArr = colChars(puzzle81, k % 9);
    const bArr = boxChars(puzzle81, k);
    const nowSet = new Set<string>([...rArr, ...cArr, ...bArr]);
    const n = nowSet.size;
    if (maxN < n) {
      maxN = n;
      bestK = k;
      cannotSet = nowSet;
    }
  }

  const options = DIGITS.filter((d) => !cannotSet.has(d));
  return { index: bestK, options };
}

/**
 * 深さ優先（スタック）で解を列挙する。`maxSolutions` 件たまったら打ち切り。
 *
 * @returns 完成盤の文字列（`'1'`〜`'9'` のみ）の配列
 */
export function sudokuEnumerateSolutions(
  puzzle81: string,
  maxSolutions: number,
): string[] {
  if (puzzle81.length !== SUDOKU_CELLS || maxSolutions < 1) {
    return [];
  }

  if (!sudokuCheckAll(puzzle81)) {
    return [];
  }

  const targetDepth = countZeros(puzzle81);
  const solutions: string[] = [];
  const stack: Array<{ depth: number; grid: string }> = [
    { depth: 0, grid: puzzle81 },
  ];

  while (stack.length > 0 && solutions.length < maxSolutions) {
    const { depth, grid } = stack.pop()!;

    if (depth === targetDepth) {
      solutions.push(grid);
      continue;
    }

    const next = sudokuFindNext(grid);
    if (next === null || next.options.length === 0) {
      continue;
    }

    const { index: k, options } = next;
    for (let oi = options.length - 1; oi >= 0; oi--) {
      const j = options[oi];
      const newGrid = grid.slice(0, k) + j + grid.slice(k + 1);
      stack.push({ depth: depth + 1, grid: newGrid });
    }
  }

  return solutions;
}

/**
 * 解が 0 / 1 / 複数あるかを判定（複数は最大 2 件まで探索）。
 */
export function sudokuSolutionCountKind(
  puzzle81: string,
):
  | { kind: "none" }
  | { kind: "unique"; solution81: string }
  | { kind: "multiple" } {
  const found = sudokuEnumerateSolutions(puzzle81, 2);
  if (found.length === 0) return { kind: "none" };
  if (found.length === 1) return { kind: "unique", solution81: found[0] };
  return { kind: "multiple" };
}
