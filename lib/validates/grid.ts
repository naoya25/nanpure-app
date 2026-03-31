export const SUDOKU_CELLS = 81;

/**
 * マス `index` と同じ行・列・3×3 ブロックに属する全マスのインデックス（自身を含む）。
 * メモの自動削除など、ユニット単位の走査に使う。
 */
export function sudokuPeerIndices(index: number): readonly number[] {
  if (!Number.isInteger(index) || index < 0 || index >= SUDOKU_CELLS) {
    throw new RangeError(`cell index out of range: ${index}`);
  }
  const row = Math.floor(index / 9);
  const col = index % 9;
  const seen = new Set<number>();
  for (let c = 0; c < 9; c++) seen.add(row * 9 + c);
  for (let r = 0; r < 9; r++) seen.add(r * 9 + col);
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      seen.add((br + dr) * 9 + (bc + dc));
    }
  }
  return [...seen];
}

export type ParsedPuzzle = {
  /** 各マス 0〜9（0 は空） */
  values: number[];
  /** 問題で与えられたマス（ユーザーは変更不可） */
  fixed: boolean[];
};

/**
 * `puzzle_81` を盤面用にパースする。長さ・文字が不正なら例外。
 */
export function parsePuzzle81(puzzle81: string): ParsedPuzzle {
  if (puzzle81.length !== SUDOKU_CELLS) {
    throw new Error(
      `puzzle_81 must be ${SUDOKU_CELLS} chars, got ${puzzle81.length}`,
    );
  }
  const values = [...puzzle81].map((ch) => {
    const n = parseInt(ch, 10);
    if (!Number.isFinite(n) || n < 0 || n > 9) {
      throw new Error(`invalid puzzle character: ${ch}`);
    }
    return n;
  });
  const fixed = values.map((v) => v !== 0);
  return { values, fixed };
}

/**
 * 盤面作成など用。`candidateMasks81`（81 個の候補ビットマスク）を文字列からパースする。
 * - JSON 配列（例: `[0, 324, 511, ...]`）
 * - カンマ・空白・改行混在の整数列（ログや CSV からの貼り付け向け）
 *
 * 各値は下位 9 ビット（0〜511）だけ採用する。要素数が 81 でなければ例外。
 */
export function parseCandidateMasks81String(input: string): number[] {
  const t = input.trim();
  if (t.length === 0) {
    throw new Error("候補マスクの入力が空です。");
  }

  let nums: number[];
  if (t.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(t) as unknown;
    } catch {
      throw new Error("候補マスクの JSON が不正です。");
    }
    if (!Array.isArray(parsed)) {
      throw new Error("候補マスクは JSON では数値の配列である必要があります。");
    }
    nums = parsed.map((item, i) => {
      const n =
        typeof item === "number" && Number.isInteger(item)
          ? item
          : Number.parseInt(String(item), 10);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw new Error(`候補マスクのインデックス ${i} が整数ではありません。`);
      }
      return n;
    });
  } else {
    const matches = [...t.matchAll(/-?\d+/g)];
    nums = matches.map((m, i) => {
      const n = Number.parseInt(m[0]!, 10);
      if (!Number.isFinite(n)) {
        throw new Error(`候補マスクの数値の抽出に失敗しました（位置 ${i}）。`);
      }
      return n;
    });
  }

  if (nums.length !== SUDOKU_CELLS) {
    throw new Error(
      `候補マスクは ${SUDOKU_CELLS} 個の整数である必要があります（${nums.length} 個でした）。`,
    );
  }

  return nums.map((n) => n & 0x1ff);
}
