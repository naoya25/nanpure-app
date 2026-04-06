import { TechniqueId } from "@/lib/types/sudoku_technique_types";

/**
 * ナンプレ難易度（0〜100）の素点計算。
 *
 * - 素点（線形）: Σ（テクニック希少度ウェイト × そのテクニックの使用回数）+ 解けた場合のボーナス
 * - 未解決: 「メイト級」の巨大加算を足し、正規化後は **100 点** とする（通常ありえない難度の扱い）
 * - 正規化: y = x / (1 + x) を 0〜1 に圧縮し、**100 倍**して 100 点満点にする（解けた問題のみこの式の結果を採用）
 *
 * 希少度ウェイトは `scripts/experiment-results/2026-03-31-22-08.md` の
 * 「使用率(全体)」（1000 問・生成パズルにおけるテクニック runner の集計）を参照して固定化した。
 * 使用率 p（0〜1）に対し概ね `(1 - p) * 40 + 1` を四捨五入し、最低 1。レポートに無い ID は p=0 扱い。
 */

/** 未解決時に素点へ足す値。正規化で実質 100 点に寄せる（チェスでいうメイトのような「盤外の」加点） */
export const UNSOLVED_MATE_RAW_SCORE = 1e12;

/** 解けたときだけ素点に足すボーナス（0 ステップのみの辺でも下限が付きすぎないよう小さめ） */
export const SOLVED_RAW_BONUS = 0.15;

/** 実験レポート（2026-03-31）の「使用率(全体)」% 。 TechniqueId と対応。 */
const USAGE_RATE_PERCENT_OVERALL: Partial<Record<TechniqueId, number>> = {
  [TechniqueId.FULL_HOUSE]: 96.7,
  [TechniqueId.SINGLE]: 99.0,
  [TechniqueId.HIDDEN_SINGLE]: 98.7,
  [TechniqueId.PENCIL_MARK]: 57.3,
  [TechniqueId.MEMO_SINGLE]: 0.0,
  [TechniqueId.POINTING]: 51.4,
  [TechniqueId.BOX_LINE_REDUCTION]: 26.4,
  [TechniqueId.PAIR]: 23.7,
  [TechniqueId.TRIPLE]: 16.4,
  [TechniqueId.QUAD]: 6.7,
  [TechniqueId.HIDDEN_PAIR]: 1.0,
  [TechniqueId.HIDDEN_TRIPLE]: 0.4,
  [TechniqueId.HIDDEN_QUAD]: 0.0,
  [TechniqueId.FISH_22]: 5.8,
  [TechniqueId.FISH_33]: 1.5,
  [TechniqueId.FISH_44]: 0.0,
  [TechniqueId.FISH_55]: 0.0,
  [TechniqueId.FISH_66]: 0.0,
  [TechniqueId.FISH_77]: 0.0,
  [TechniqueId.FISH_88]: 0.0,
  [TechniqueId.SKYSCRAPER]: 16.1,
  [TechniqueId.TWO_STRING_KITE]: 14.2,
  [TechniqueId.TURBO_FISH]: 0.6,
  [TechniqueId.XY_WING]: 13.2,
  [TechniqueId.XYZ_WING]: 5.4,
  [TechniqueId.WXYZ_WING]: 0.0,
  [TechniqueId.W_WING]: 6.7,
  [TechniqueId.UNIQUE_RECTANGLE]: 3.0,
  [TechniqueId.BUG_PLUS_1]: 1.2,
  [TechniqueId.XY_CHAIN]: 15.2,
  [TechniqueId.X_CHAIN]: 4.1,
  [TechniqueId.X_CYCLE]: 0.0,
  [TechniqueId.ALS_XZ]: 13.4,
  [TechniqueId.AIC]: 6.8,
};

function rarityWeightFromUsagePercent(usagePercent: number): number {
  const p = Math.min(1, Math.max(0, usagePercent / 100));
  return Math.max(1, Math.round((1 - p) * 40 + 1));
}

/** 各 TechniqueId の希少度（固定係数）。 */
export const TECHNIQUE_RARITY_WEIGHT: Record<TechniqueId, number> = (() => {
  const out = {} as Record<TechniqueId, number>;
  for (const id of Object.values(TechniqueId) as TechniqueId[]) {
    const pct = USAGE_RATE_PERCENT_OVERALL[id];
    out[id] = rarityWeightFromUsagePercent(pct ?? 0);
  }
  return out;
})();

export type TechniqueStepCounts = Partial<Record<TechniqueId, number>>;

export type SudokuDifficultyScoreInput = {
  /** テクニックごとのステップ数（未使用は 0 または省略） */
  techniqueStepCounts: TechniqueStepCounts;
  /** 論理 runner が最終盤面を正解と一致させられたか */
  solved: boolean;
};

export type SudokuDifficultyScoreResult = {
  /** 0〜100 の難易度点。未解決は常に 100 */
  difficultyScore100: number;
  /** 正規化前の線形素点（ボーナス・メイト加点込み） */
  rawLinearScore: number;
  /** y = raw / (1 + raw)。未解決でも計算上の値は返すが、`difficultyScore100` は 100 */
  normalized01: number;
};

export function computeLinearDifficultyScore(
  techniqueStepCounts: TechniqueStepCounts,
  solved: boolean,
): number {
  let sum = 0;
  for (const id of Object.values(TechniqueId) as TechniqueId[]) {
    const n = techniqueStepCounts[id];
    if (n === undefined || n <= 0) continue;
    sum += TECHNIQUE_RARITY_WEIGHT[id] * n;
  }
  if (solved) {
    sum += SOLVED_RAW_BONUS;
  } else {
    sum += UNSOLVED_MATE_RAW_SCORE;
  }
  return sum;
}

function squashTo01(x: number): number {
  if (x <= 0) return 0;
  return x / (1 + x);
}

/**
 * テクニック使用回数と成否から難易度点（100 満点）を返す。
 */
export function computeSudokuDifficultyScore(
  input: SudokuDifficultyScoreInput,
): SudokuDifficultyScoreResult {
  const rawLinearScore = computeLinearDifficultyScore(
    input.techniqueStepCounts,
    input.solved,
  );
  const normalized01 = squashTo01(rawLinearScore);

  const difficultyScore100 = input.solved
    ? Math.min(100, Math.max(0, Math.round(100 * normalized01)))
    : 100;

  return {
    difficultyScore100,
    rawLinearScore,
    normalized01,
  };
}
