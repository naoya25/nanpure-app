import { TechniqueId } from "@/lib/types/sudoku_technique_types";
import { SUDOKU_CELLS } from "@/lib/validates/grid";

/**
 * ナンプレ難易度（解けた問題は 50〜100、未解決は **100 を超えうる**）。
 *
 * ## 解けた問題
 * 1. 各テクニックには **固定の難易度点** `TECHNIQUE_DIFFICULTY_BASE`（おおよそ易→難）を割り当てる。
 * 2. **基準点** = 実際に使ったテクニックのうち、その固定点が **最大** のもの（＝その解き筋で要した最高難易度）。
 * 3. その上で **少しだけ** 以下を加味して予備点を作る:
 *    - 総ステップ数（手数が多いほど僅かに加点、上限あり）
 *    - 使ったテクニックの **種類数**（多様性、上限あり）
 *    - 基準より易しいテクニックの **使用ボリューム**（係数小・上限あり）
 *    - 基準と同じ最難テクニックを **複数回** 使った場合の微加点（上限あり）
 * 4. 予備点を **50〜100** に四捨五入・クランプする。
 *
 * ## 未解決
 * **100 + 残り空マス数**（0..81）→ **100..181**。空マスが多いほど「解けきっていない」難度が上乗せされる。
 * `emptyCellsRemaining` を省略したときは 81（フル空白扱い）→ 181。
 */

/** 未解決スコアの下限（空マス 0 のとき）。解けた問題の上限 100 と数値が重なるが、フラグで区別する */
export const UNSOLVED_DIFFICULTY_MIN = 100;

/** 未解決スコアの上限（100 + 81） */
export const UNSOLVED_DIFFICULTY_MAX = 100 + SUDOKU_CELLS;

/** runner が 0 ステップで解けた（初期から完成など）ときの基準予備点 */
export const SOLVED_ZERO_STEP_BASE_SCORE = 48;

export const SOLVED_DIFFICULTY_SCORE_MIN = 50;
export const SOLVED_DIFFICULTY_SCORE_MAX = 100;

/** 総ステップあたりの微加点（上限 `STEP_ADJUSTMENT_CAP`） */
const STEP_ADJUSTMENT_PER_STEP = 0.11;
const STEP_ADJUSTMENT_CAP = 10;

/** 使ったテクニック種類が増えた分の微加点（1 種類目は無し） */
const DISTINCT_BONUS_PER = 1.2;
const DISTINCT_BONUS_CAP = 6;

/** 基準より易しいテクニック: Σ(n × tier × coeff)、上限 `LOWER_TIER_EFFORT_CAP` */
const LOWER_TIER_EFFORT_COEFF = 0.045;
const LOWER_TIER_EFFORT_CAP = 12;

/** 最難テクニックを同一で複数回: (n-1) × coeff、上限 `MAX_TIER_REPEAT_EXTRA_CAP` */
const MAX_TIER_REPEAT_EXTRA_COEFF = 0.35;
const MAX_TIER_REPEAT_EXTRA_CAP = 8;

/**
 * テクニックごとの **おおよその難易度（点）**。
 * `docs/sudoku-techniques.md` / `TECHNIQUE_LABELS` の易→難の並びを目安に段階を付けた固定表。
 */
export const TECHNIQUE_DIFFICULTY_BASE: Record<TechniqueId, number> = {
  [TechniqueId.FULL_HOUSE]: 12,
  [TechniqueId.SINGLE]: 14,
  [TechniqueId.HIDDEN_SINGLE]: 16,
  [TechniqueId.PENCIL_MARK]: 20,
  [TechniqueId.MEMO_SINGLE]: 22,
  [TechniqueId.POINTING]: 28,
  [TechniqueId.BOX_LINE_REDUCTION]: 32,
  [TechniqueId.PAIR]: 36,
  [TechniqueId.TRIPLE]: 40,
  [TechniqueId.QUAD]: 44,
  [TechniqueId.HIDDEN_PAIR]: 46,
  [TechniqueId.HIDDEN_TRIPLE]: 48,
  [TechniqueId.HIDDEN_QUAD]: 50,
  [TechniqueId.FISH_22]: 50,
  [TechniqueId.FISH_33]: 54,
  [TechniqueId.FISH_44]: 58,
  [TechniqueId.FISH_55]: 60,
  [TechniqueId.FISH_66]: 62,
  [TechniqueId.FISH_77]: 64,
  [TechniqueId.FISH_88]: 66,
  [TechniqueId.SKYSCRAPER]: 52,
  [TechniqueId.TWO_STRING_KITE]: 56,
  [TechniqueId.TURBO_FISH]: 60,
  [TechniqueId.XY_WING]: 62,
  [TechniqueId.XYZ_WING]: 64,
  [TechniqueId.WXYZ_WING]: 68,
  [TechniqueId.W_WING]: 63,
  [TechniqueId.UNIQUE_RECTANGLE]: 72,
  [TechniqueId.BUG_PLUS_1]: 74,
  [TechniqueId.XY_CHAIN]: 76,
  [TechniqueId.X_CHAIN]: 78,
  [TechniqueId.X_CYCLE]: 80,
  [TechniqueId.ALS_XZ]: 82,
  [TechniqueId.AIC]: 84,
};

export type TechniqueStepCounts = Partial<Record<TechniqueId, number>>;

export type SudokuDifficultyScoreInput = {
  techniqueStepCounts: TechniqueStepCounts;
  solved: boolean;
  /** 未解決時: runner 終了時の空マス数（0..81）。省略時は 81 */
  emptyCellsRemaining?: number;
};

export type SudokuDifficultyScoreResult = {
  /**
   * 解けた場合 50〜100。未解決は **100 + 空マス**（100..181。プロパティ名は後方互換のまま）。
   */
  difficultyScore100: number;
  /** 解けた場合は素点（クランプ前）、未解決は `100 + 空マス` と同じ整数 */
  rawLinearScore: number;
  /**
   * 解けた場合: (score-50)/50 を 0〜1 に。
   * 未解決も含め全体帯を 50（解けた下限）〜181（未解決上限）に正規化して 0〜1。
   */
  normalized01: number;
  /** 解けて 1 ステップ以上あるとき: 基準となった最高難易度の固定点 */
  baselineMaxTechniqueDifficulty?: number;
};

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

function usedStepEntries(
  counts: TechniqueStepCounts,
): [TechniqueId, number][] {
  const out: [TechniqueId, number][] = [];
  for (const id of Object.values(TechniqueId) as TechniqueId[]) {
    const n = counts[id];
    if (n !== undefined && n > 0) {
      out.push([id, n]);
    }
  }
  return out;
}

/**
 * 解けた問題の予備点（クランプ前）と基準難易度。
 */
export function computeSolvedDifficultyPreliminary(
  techniqueStepCounts: TechniqueStepCounts,
): { preliminary: number; baselineMax: number | undefined } {
  const entries = usedStepEntries(techniqueStepCounts);
  if (entries.length === 0) {
    return { preliminary: SOLVED_ZERO_STEP_BASE_SCORE, baselineMax: undefined };
  }

  let baselineMax = 0;
  for (const [id] of entries) {
    baselineMax = Math.max(baselineMax, TECHNIQUE_DIFFICULTY_BASE[id]);
  }

  const totalSteps = entries.reduce((s, [, n]) => s + n, 0);
  const distinct = entries.length;

  const stepAdj = Math.min(STEP_ADJUSTMENT_CAP, totalSteps * STEP_ADJUSTMENT_PER_STEP);
  const distinctAdj = Math.min(
    DISTINCT_BONUS_CAP,
    Math.max(0, distinct - 1) * DISTINCT_BONUS_PER,
  );

  let lowerTierEffort = 0;
  let maxTierRepeatExtra = 0;

  for (const [id, n] of entries) {
    const tier = TECHNIQUE_DIFFICULTY_BASE[id];
    if (tier < baselineMax) {
      lowerTierEffort += n * tier * LOWER_TIER_EFFORT_COEFF;
    } else if (tier === baselineMax) {
      maxTierRepeatExtra += Math.max(0, n - 1) * MAX_TIER_REPEAT_EXTRA_COEFF;
    }
  }

  lowerTierEffort = Math.min(LOWER_TIER_EFFORT_CAP, lowerTierEffort);
  maxTierRepeatExtra = Math.min(MAX_TIER_REPEAT_EXTRA_CAP, maxTierRepeatExtra);

  const preliminary =
    baselineMax + stepAdj + distinctAdj + lowerTierEffort + maxTierRepeatExtra;

  return { preliminary, baselineMax };
}

/**
 * 未解決: **100 + 空マス数**（整数、100..181）。`normalized01` は 50〜181 を 0〜1 に線形マップ。
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
  const span = UNSOLVED_DIFFICULTY_MAX - SOLVED_DIFFICULTY_SCORE_MIN;
  const normalized01 = clamp01((score - SOLVED_DIFFICULTY_SCORE_MIN) / span);
  return {
    difficultyScore100: score,
    rawLinearScore: score,
    normalized01,
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
    const u = computeUnsolvedDifficultyFromEmptyCells(empty);
    return {
      difficultyScore100: u.difficultyScore100,
      rawLinearScore: u.rawLinearScore,
      normalized01: u.normalized01,
    };
  }

  const { preliminary, baselineMax } = computeSolvedDifficultyPreliminary(
    input.techniqueStepCounts,
  );

  const difficultyScore100 = Math.min(
    SOLVED_DIFFICULTY_SCORE_MAX,
    Math.max(
      SOLVED_DIFFICULTY_SCORE_MIN,
      Math.round(preliminary),
    ),
  );

  const normalized01 = clamp01(
    (difficultyScore100 - SOLVED_DIFFICULTY_SCORE_MIN) /
      (SOLVED_DIFFICULTY_SCORE_MAX - SOLVED_DIFFICULTY_SCORE_MIN),
  );

  return {
    difficultyScore100,
    rawLinearScore: preliminary,
    normalized01,
    baselineMaxTechniqueDifficulty:
      baselineMax !== undefined && baselineMax > 0 ? baselineMax : undefined,
  };
}
