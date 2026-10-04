import { TechniqueId } from "@/lib/types/sudoku_technique_types";
import { SUDOKU_CELLS } from "@/lib/validates/grid";

/**
 * ナンプレ難易度。解けた問題は Σ（使用回数 × 希少度）を、難易度 100% の生成問題の分布の百分位で 1〜100 にする。
 * 未解決は 100 + 残り空マス（100..181）。
 */

/** 未解決スコアの下限（空マス 0 のとき）。解けた問題の上限 100 と数値が重なるが、フラグで区別する */
export const UNSOLVED_DIFFICULTY_MIN = 100;

/** 未解決スコアの上限（100 + 81） */
export const UNSOLVED_DIFFICULTY_MAX = 100 + SUDOKU_CELLS;

export const SOLVED_DIFFICULTY_SCORE_MIN = 1;
export const SOLVED_DIFFICULTY_SCORE_MAX = 100;

/** 希少度の出典にした集計の問題数 */
const REFERENCE_PUZZLE_COUNT = 1000;

/**
 * 難易度 100% の生成問題 1000 問を全テクニックで解いたとき、各テクニックを 1 回以上使った問題数。
 * 出典: `scripts/experiment-results/2026-09-23-22-23.md` の「使用率(全体)」× 1000。
 * テクニックを足したら `scripts/experiment-technique-stats.ts` で取り直す。
 */
const TECHNIQUE_USED_PUZZLE_COUNT: Record<TechniqueId, number> = {
  [TechniqueId.FULL_HOUSE]: 1000,
  [TechniqueId.SINGLE]: 1000,
  [TechniqueId.HIDDEN_SINGLE]: 990,
  [TechniqueId.PENCIL_MARK]: 572,
  [TechniqueId.MEMO_SINGLE]: 0,
  [TechniqueId.POINTING]: 526,
  [TechniqueId.BOX_LINE_REDUCTION]: 294,
  [TechniqueId.PAIR]: 273,
  [TechniqueId.TRIPLE]: 161,
  [TechniqueId.QUAD]: 79,
  [TechniqueId.HIDDEN_PAIR]: 14,
  [TechniqueId.HIDDEN_TRIPLE]: 0,
  [TechniqueId.HIDDEN_QUAD]: 1,
  [TechniqueId.FISH_22]: 53,
  [TechniqueId.FISH_33]: 13,
  [TechniqueId.FISH_44]: 0,
  [TechniqueId.FISH_55]: 0,
  [TechniqueId.FISH_66]: 0,
  [TechniqueId.FISH_77]: 0,
  [TechniqueId.FISH_88]: 0,
  [TechniqueId.SKYSCRAPER]: 153,
  [TechniqueId.TWO_STRING_KITE]: 150,
  [TechniqueId.TURBO_FISH]: 17,
  [TechniqueId.XY_WING]: 151,
  [TechniqueId.XYZ_WING]: 70,
  [TechniqueId.WXYZ_WING]: 0,
  [TechniqueId.W_WING]: 79,
  [TechniqueId.UNIQUE_RECTANGLE]: 41,
  [TechniqueId.BUG_PLUS_1]: 10,
  [TechniqueId.XY_CHAIN]: 168,
  [TechniqueId.X_CHAIN]: 51,
  [TechniqueId.X_CYCLE]: 0,
  [TechniqueId.ALS_XZ]: 176,
  [TechniqueId.AIC]: 88,
  [TechniqueId.TRIAL_AND_ERROR]: 60,
};

/**
 * テクニックごとの希少度 −log2(使用率)。
 * 使用率は (使った問題数 + 1) / (問題数 + 2) で見積もる（0% の手筋でも有限の重みにするため）。
 */
export const TECHNIQUE_RARITY_WEIGHT: Record<TechniqueId, number> = Object.fromEntries(
  (Object.values(TechniqueId) as TechniqueId[]).map((id) => [
    id,
    -Math.log2(
      (TECHNIQUE_USED_PUZZLE_COUNT[id] + 1) / (REFERENCE_PUZZLE_COUNT + 2),
    ),
  ]),
) as Record<TechniqueId, number>;

/**
 * Level 2〜100 に上がる素点の境目（難易度 100% の生成問題の素点の 1〜99 百分位）。
 * 素点がこの値を **超える** たびに Level が 1 上がる。
 * 出典: `scripts/experiment-results/2026-10-04-18-31-level-thresholds.md`（`scripts/experiment-level-thresholds.ts`）。
 * `TECHNIQUE_RARITY_WEIGHT` を変えたら取り直す。
 */
export const SOLVED_RAW_SCORE_LEVEL_THRESHOLDS: readonly number[] = [
  0.0418, 0.0519, 0.0563, 0.0592, 0.065, 0.0679, 0.0707, 0.0722, 0.0751, 0.0794,
  0.0809, 0.0838, 0.0852, 0.0881, 0.0896, 0.0924, 0.094, 0.0954, 0.0983, 0.0983,
  0.0997, 0.1012, 0.1026, 0.104, 0.1056, 0.1084, 0.1084, 0.1099, 0.1113, 0.1142,
  0.1156, 0.1186, 0.1243, 0.1258, 0.1287, 0.1301, 0.1344, 0.1374, 0.1417, 0.1475,
  0.1518, 0.1635, 0.1847, 1.8263, 1.8513, 1.8882, 2.7383, 2.7745, 2.805, 2.8484,
  3.6031, 3.6368, 3.6907, 3.7535, 4.59, 4.64, 5.321, 5.5217, 5.6298, 6.4167,
  6.9732, 7.2958, 8.0187, 8.2954, 9.034, 9.729, 10.4455, 10.9083, 11.1605, 11.8323,
  12.7413, 13.4986, 14.1664, 14.7298, 15.9109, 17.0114, 17.7112, 18.9992, 19.8182, 20.6912,
  21.6396, 22.7321, 23.862, 24.6419, 26.02, 27.0726, 28.0545, 29.5321, 30.6685, 32.5398,
  34.2183, 35.6005, 36.648, 38.7803, 41.8714, 45.8137, 51.9442, 57.0716, 63.5496,
];

export type TechniqueStepCounts = Partial<Record<TechniqueId, number>>;

export type SudokuDifficultyScoreInput = {
  techniqueStepCounts: TechniqueStepCounts;
  solved: boolean;
  /** 未解決時: runner 終了時の空マス数（0..81）。省略時は 81 */
  emptyCellsRemaining?: number;
};

export type SudokuDifficultyScoreResult = {
  /**
   * 解けた場合 1〜100。未解決は **100 + 空マス**（100..181。プロパティ名は後方互換のまま）。
   */
  difficultyScore100: number;
  /** 解けた場合は素点 Σ（回数 × 希少度）、未解決は `100 + 空マス` と同じ整数 */
  rawLinearScore: number;
  /** 全体帯を 1（解けた下限）〜181（未解決上限）に正規化して 0〜1 */
  normalized01: number;
};

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

function normalizeOverallBand(score: number): number {
  return clamp01(
    (score - SOLVED_DIFFICULTY_SCORE_MIN) /
      (UNSOLVED_DIFFICULTY_MAX - SOLVED_DIFFICULTY_SCORE_MIN),
  );
}

/** 解けた問題の素点 Σ（使用回数 × 希少度）。0 以下の回数は無視する */
export function computeSolvedRawScore(
  techniqueStepCounts: TechniqueStepCounts,
): number {
  let raw = 0;
  for (const id of Object.values(TechniqueId) as TechniqueId[]) {
    const n = techniqueStepCounts[id];
    if (n !== undefined && n > 0) {
      raw += n * TECHNIQUE_RARITY_WEIGHT[id];
    }
  }
  return raw;
}

/** 素点を百分位の境目で 1〜100 に直す */
export function solvedLevelFromRawScore(
  raw: number,
  thresholds: readonly number[] = SOLVED_RAW_SCORE_LEVEL_THRESHOLDS,
): number {
  let level = SOLVED_DIFFICULTY_SCORE_MIN;
  for (const t of thresholds) {
    if (raw > t) level += 1;
  }
  return Math.min(SOLVED_DIFFICULTY_SCORE_MAX, level);
}

/**
 * 未解決: **100 + 空マス数**（整数、100..181）。
 */
export function computeUnsolvedDifficultyFromEmptyCells(emptyCellsRemaining: number): {
  difficultyScore100: number;
  rawLinearScore: number;
  normalized01: number;
} {
  const k = Math.max(
    0,
    Math.min(SUDOKU_CELLS, Math.floor(emptyCellsRemaining)),
  );
  const score = UNSOLVED_DIFFICULTY_MIN + k;
  return {
    difficultyScore100: score,
    rawLinearScore: score,
    normalized01: normalizeOverallBand(score),
  };
}

export function computeSudokuDifficultyScore(
  input: SudokuDifficultyScoreInput,
): SudokuDifficultyScoreResult {
  if (!input.solved) {
    const empty =
      input.emptyCellsRemaining !== undefined
        ? input.emptyCellsRemaining
        : SUDOKU_CELLS;
    return computeUnsolvedDifficultyFromEmptyCells(empty);
  }

  const raw = computeSolvedRawScore(input.techniqueStepCounts);
  const difficultyScore100 = solvedLevelFromRawScore(raw);
  return {
    difficultyScore100,
    rawLinearScore: raw,
    normalized01: normalizeOverallBand(difficultyScore100),
  };
}
