import type { SudokuGrid } from "@/lib/models/sudoku_grid";

/** 難易度の低い順チェーン（適用順）のためのテクニック ID */
export enum TechniqueId {
  FULL_HOUSE = "FULL_HOUSE",
  SINGLE = "SINGLE",
  HIDDEN_SINGLE = "HIDDEN_SINGLE",
  PENCIL_MARK = "PENCIL_MARK",
  MEMO_SINGLE = "MEMO_SINGLE",
  POINTING = "POINTING",
  BOX_LINE_REDUCTION = "BOX_LINE_REDUCTION",
  PAIR = "PAIR",
  TRIPLE = "TRIPLE",
  QUAD = "QUAD",
  HIDDEN_PAIR = "HIDDEN_PAIR",
  HIDDEN_TRIPLE = "HIDDEN_TRIPLE",
  HIDDEN_QUAD = "HIDDEN_QUAD",
  FISH_22 = "FISH_22",
  FISH_33 = "FISH_33",
  SKYSCRAPER = "SKYSCRAPER",
  TWO_STRING_KITE = "TWO_STRING_KITE",
  X_CHAIN = "X_CHAIN",
  TURBO_FISH = "TURBO_FISH",
  XY_WING = "XY_WING",
  XYZ_WING = "XYZ_WING",
  WXYZ_WING = "WXYZ_WING",
  W_WING = "W_WING",
  UNIQUE_RECTANGLE = "UNIQUE_RECTANGLE",
  BUG_PLUS_1 = "BUG_PLUS_1",
  XY_CHAIN = "XY_CHAIN",
  X_CYCLE = "X_CYCLE",
  ALS_XZ = "ALS_XZ",
  AIC = "AIC",
  FISH_44 = "FISH_44",
  FISH_55 = "FISH_55",
  FISH_66 = "FISH_66",
  FISH_77 = "FISH_77",
  FISH_88 = "FISH_88",
  /** 他のテクニックがすべて空振りしたときの最後の手段。必ず末尾に置く（テストで固定） */
  TRIAL_AND_ERROR = "TRIAL_AND_ERROR",
}

export type TechniqueDescriptor = {
  id: TechniqueId;
  label: string;
};

/** 適用順（`TechniqueId` の並び）の全 ID。runner・レベル算出・統計はこれを使う */
export const ALL_TECHNIQUE_IDS: readonly TechniqueId[] = Object.values(TechniqueId);

export const TECHNIQUE_LABEL_BY_ID: Record<TechniqueId, string> = {
  [TechniqueId.FULL_HOUSE]: "フルハウス",
  [TechniqueId.SINGLE]: "シングル",
  [TechniqueId.HIDDEN_SINGLE]: "隠れシングル",
  [TechniqueId.PENCIL_MARK]: "ペンシルマーク",
  [TechniqueId.MEMO_SINGLE]: "メモ1確定",
  [TechniqueId.POINTING]: "ポインティング",
  [TechniqueId.BOX_LINE_REDUCTION]: "ボックス・ライン削減",
  [TechniqueId.PAIR]: "ペア",
  [TechniqueId.TRIPLE]: "トリプル",
  [TechniqueId.QUAD]: "クァッド",
  [TechniqueId.HIDDEN_PAIR]: "隠れペア",
  [TechniqueId.HIDDEN_TRIPLE]: "隠れトリプル",
  [TechniqueId.HIDDEN_QUAD]: "隠れクァッド",
  [TechniqueId.FISH_22]: "fish22（X-Wing）",
  [TechniqueId.FISH_33]: "fish33（Swordfish）",
  [TechniqueId.FISH_44]: "fish44（Jellyfish）",
  [TechniqueId.FISH_55]: "fish55",
  [TechniqueId.FISH_66]: "fish66",
  [TechniqueId.FISH_77]: "fish77",
  [TechniqueId.FISH_88]: "fish88",
  [TechniqueId.SKYSCRAPER]: "スカイスクレーパー",
  [TechniqueId.TWO_STRING_KITE]: "ツーストリング・カイト",
  [TechniqueId.TURBO_FISH]: "ターボフィッシュ",
  [TechniqueId.XY_WING]: "XY-Wing",
  [TechniqueId.XYZ_WING]: "XYZ-Wing",
  [TechniqueId.WXYZ_WING]: "WXYZ-Wing",
  [TechniqueId.W_WING]: "W-Wing",
  [TechniqueId.UNIQUE_RECTANGLE]: "ユニーク長方形",
  [TechniqueId.BUG_PLUS_1]: "BUG+1",
  [TechniqueId.XY_CHAIN]: "XY-Chain",
  [TechniqueId.X_CHAIN]: "X-Chain",
  [TechniqueId.X_CYCLE]: "X-Cycle",
  [TechniqueId.ALS_XZ]: "ALS-XZ",
  [TechniqueId.AIC]: "AIC",
  [TechniqueId.TRIAL_AND_ERROR]: "仮置き",
};

/** 画面での並び。適用順とは別に決めている（全 ID を 1 回ずつ含むことはテストで固定） */
const TECHNIQUE_DISPLAY_ORDER: readonly TechniqueId[] = [
  TechniqueId.FULL_HOUSE,
  TechniqueId.SINGLE,
  TechniqueId.HIDDEN_SINGLE,
  TechniqueId.PENCIL_MARK,
  TechniqueId.MEMO_SINGLE,
  TechniqueId.POINTING,
  TechniqueId.BOX_LINE_REDUCTION,
  TechniqueId.PAIR,
  TechniqueId.TRIPLE,
  TechniqueId.QUAD,
  TechniqueId.HIDDEN_PAIR,
  TechniqueId.HIDDEN_TRIPLE,
  TechniqueId.HIDDEN_QUAD,
  TechniqueId.FISH_22,
  TechniqueId.FISH_33,
  TechniqueId.FISH_44,
  TechniqueId.FISH_55,
  TechniqueId.FISH_66,
  TechniqueId.FISH_77,
  TechniqueId.FISH_88,
  TechniqueId.SKYSCRAPER,
  TechniqueId.TWO_STRING_KITE,
  TechniqueId.TURBO_FISH,
  TechniqueId.XY_WING,
  TechniqueId.XYZ_WING,
  TechniqueId.WXYZ_WING,
  TechniqueId.W_WING,
  TechniqueId.UNIQUE_RECTANGLE,
  TechniqueId.BUG_PLUS_1,
  TechniqueId.XY_CHAIN,
  TechniqueId.X_CHAIN,
  TechniqueId.X_CYCLE,
  TechniqueId.ALS_XZ,
  TechniqueId.AIC,
  TechniqueId.TRIAL_AND_ERROR,
];

export const TECHNIQUE_LABELS: readonly TechniqueDescriptor[] = TECHNIQUE_DISPLAY_ORDER.map(
  (id) => ({ id, label: TECHNIQUE_LABEL_BY_ID[id] }),
);

/**
 * ヒント一覧・自動実行の選択の並び（重要度順）。難易度 100% の生成問題 1000 問を全テクニックで解いたときの
 * 使用率（その手筋を 1 回以上使った問題の割合）が高い順。同率は平均使用回数の多い順、それも同じなら適用順。
 * 出典: `scripts/experiment-results/2026-09-23-22-23.md`（`scripts/experiment-technique-stats.ts`）。
 * テクニックを足したら統計を取り直して並べ直す（全 ID を 1 回ずつ含むことはテストで固定）。
 */
const TECHNIQUE_IMPORTANCE_ORDER: readonly TechniqueId[] = [
  TechniqueId.SINGLE, // 100.0%（平均 12.70 回）
  TechniqueId.FULL_HOUSE, // 100.0%（平均 10.90 回）
  TechniqueId.HIDDEN_SINGLE, // 99.0%
  TechniqueId.PENCIL_MARK, // 57.2%
  TechniqueId.POINTING, // 52.6%
  TechniqueId.BOX_LINE_REDUCTION, // 29.4%
  TechniqueId.PAIR, // 27.3%
  TechniqueId.ALS_XZ, // 17.6%
  TechniqueId.XY_CHAIN, // 16.8%
  TechniqueId.TRIPLE, // 16.1%
  TechniqueId.SKYSCRAPER, // 15.3%
  TechniqueId.XY_WING, // 15.1%
  TechniqueId.TWO_STRING_KITE, // 15.0%
  TechniqueId.AIC, // 8.8%
  TechniqueId.QUAD, // 7.9%
  TechniqueId.W_WING, // 7.9%
  TechniqueId.XYZ_WING, // 7.0%
  TechniqueId.TRIAL_AND_ERROR, // 6.0%
  TechniqueId.FISH_22, // 5.3%
  TechniqueId.X_CHAIN, // 5.1%
  TechniqueId.UNIQUE_RECTANGLE, // 4.1%
  TechniqueId.TURBO_FISH, // 1.7%
  TechniqueId.HIDDEN_PAIR, // 1.4%
  TechniqueId.FISH_33, // 1.3%
  TechniqueId.BUG_PLUS_1, // 1.0%
  TechniqueId.HIDDEN_QUAD, // 0.1%
  // 以下 0.0%（適用順）
  TechniqueId.MEMO_SINGLE,
  TechniqueId.HIDDEN_TRIPLE,
  TechniqueId.WXYZ_WING,
  TechniqueId.X_CYCLE,
  TechniqueId.FISH_44,
  TechniqueId.FISH_55,
  TechniqueId.FISH_66,
  TechniqueId.FISH_77,
  TechniqueId.FISH_88,
];

export const TECHNIQUE_IMPORTANCE_LABELS: readonly TechniqueDescriptor[] = TECHNIQUE_IMPORTANCE_ORDER.map(
  (id) => ({ id, label: TECHNIQUE_LABEL_BY_ID[id] }),
);

export type TechniqueStepResult =
  | {
      applied: true;
      techniqueId: TechniqueId;
      cellIndex: number[];
      grid: SudokuGrid;
    }
  | {
      applied: false;
      grid: SudokuGrid;
    };

/** ヒントの解説: この手が今の盤面でなぜ成り立つか */
export type TechniqueExplanation = {
  /** 根拠になるマス（パターンを作っているマス）。変更されるマス `cellIndex` とは別の色で強調する */
  basisCellIndex: number[];
  /** 今の盤面に即した理由（1〜3 文） */
  reason: string;
};

/** 技法が 1 回の適用で返す結果（変更があったセルの index と、その後の盤） */
export type TechniqueApplyResult = {
  cellIndex: number[];
  grid: SudokuGrid;
  explanation?: TechniqueExplanation;
};

/** 自動実行で 1 回適用された手のログ */
export type TechniqueAutoRunStep = {
  techniqueId: TechniqueId;
  cellIndex: number[];
  grid: SudokuGrid;
  explanation?: TechniqueExplanation;
};

/** ヒント一覧の結果。盤に解答と違う数字があるときは `conflict` */
export type TechniqueApplicableStepsResult =
  | { kind: "ok"; steps: TechniqueAutoRunStep[] }
  | { kind: "conflict"; conflictCellIndex: number[] };

/** 自動実行の結果 */
export type TechniqueAutoRunResult = {
  grid: SudokuGrid;
  steps: TechniqueAutoRunStep[];
  finishedBecauseNoChange: boolean;
  conflictCellIndex: number[] | null;
};
