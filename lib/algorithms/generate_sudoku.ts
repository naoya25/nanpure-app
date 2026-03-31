import { SUDOKU_CELLS } from "@/lib/validates/grid";
import {
  sudokuEnumerateSolutions,
  sudokuSolutionCountKind,
} from "@/lib/algorithms/sudoku_solver";

const DIGITS_1_9 = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/**
 * Fisher-Yates。`random` は [0, 1) の一様乱数（省略時は `Math.random`）。
 */
export function shuffleArrayInPlace<T>(arr: T[], random: () => number = Math.random): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
}

/**
 * ブロック番号 0, 4, 8（対角の 3x3）だけに、それぞれ 1〜9 のランダムな並びを置いた初期盤面（他は `'0'`）。
 * `sample/create-sudoku.py` の `get_init_grid` と同じ構造。
 */
export function createSudokuDiagonalBlocksSeed(
  random: () => number = Math.random,
): string {
  const arr = [...DIGITS_1_9];
  let s = "";

  shuffleArrayInPlace(arr, random);
  s += arr.slice(0, 3).join("") + "0".repeat(6);
  s += arr.slice(3, 6).join("") + "0".repeat(6);
  s += arr.slice(6, 9).join("") + "0".repeat(6);

  shuffleArrayInPlace(arr, random);
  s += "0".repeat(3) + arr.slice(0, 3).join("") + "0".repeat(3);
  s += "0".repeat(3) + arr.slice(3, 6).join("") + "0".repeat(3);
  s += "0".repeat(3) + arr.slice(6, 9).join("") + "0".repeat(3);

  shuffleArrayInPlace(arr, random);
  s += "0".repeat(6) + arr.slice(0, 3).join("");
  s += "0".repeat(6) + arr.slice(3, 6).join("");
  s += "0".repeat(6) + arr.slice(6, 9).join("");

  if (s.length !== SUDOKU_CELLS) {
    throw new Error(`internal: seed length ${s.length}, expected ${SUDOKU_CELLS}`);
  }
  return s;
}

/**
 * 完成盤 `solution81` から、`solution81` を唯一の解とするように数字を削る（貪欲）。
 * - セルを試しに空にし、`sudokuSolutionCountKind` が一意かつ解が `solution81` と一致するときだけ確定。
 * - 通しが何も削れなくなるまで繰り返し、シャッフル順を変えて再試行する（単一パスより多くのマスを空けられる）。
 *
 * 参考: `sample/create-sudoku.py` の `create_question`（ランダム順の一回パス）。
 * 一手で複数解になる候補はスキップするのみ。より強い「手戻りで別マスを試す」は別関数で拡張可能。
 */
export function reduceSudokuPuzzleByUniqueness(
  solution81: string,
  random: () => number = Math.random,
): string {
  if (solution81.length !== SUDOKU_CELLS || solution81.includes("0")) {
    throw new Error("reduceSudokuPuzzleByUniqueness expects a full grid (no zeros)");
  }

  let puzzle = solution81;
  let madeProgress = true;

  while (madeProgress) {
    madeProgress = false;
    const order = Array.from({ length: SUDOKU_CELLS }, (_, i) => i);
    shuffleArrayInPlace(order, random);

    for (const i of order) {
      if (puzzle[i] === "0") continue;

      const trial = puzzle.slice(0, i) + "0" + puzzle.slice(i + 1);
      const kind = sudokuSolutionCountKind(trial);
      if (
        kind.kind === "unique" &&
        kind.solution81 === solution81
      ) {
        puzzle = trial;
        madeProgress = true;
      }
    }
  }

  return puzzle;
}

export type GeneratedSudokuPair = {
  puzzle_81: string;
  solution_81: string;
};

/**
 * 対角ブロックシード → 完成形を 1 通り求める → 一意解を保つよう穴あけ。
 * シードが解けない場合は `null`（通常は起きにくい）。
 */
export function generateSudokuPuzzlePair(
  random: () => number = Math.random,
): GeneratedSudokuPair | null {
  const seed = createSudokuDiagonalBlocksSeed(random);
  const solved = sudokuEnumerateSolutions(seed, 1);
  if (solved.length === 0) {
    return null;
  }

  const solution_81 = solved[0]!;
  const puzzle_81 = reduceSudokuPuzzleByUniqueness(solution_81, random);

  const verify = sudokuSolutionCountKind(puzzle_81);
  if (verify.kind !== "unique" || verify.solution81 !== solution_81) {
    return null;
  }

  return { puzzle_81, solution_81 };
}
