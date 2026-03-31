import type { SudokuGrid } from "@/lib/models/sudoku_grid";

/** 難易度の低い順チェーン（適用順）のためのテクニック ID */
export enum TechniqueId {
  FULL_HOUSE = "FULL_HOUSE",
  SINGLE = "SINGLE",
  HIDDEN_SINGLE = "HIDDEN_SINGLE",
  SOLUTION_SYNC = "SOLUTION_SYNC",
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
  TURBO_FISH = "TURBO_FISH",
  XY_WING = "XY_WING",
  XYZ_WING = "XYZ_WING",
  WXYZ_WING = "WXYZ_WING",
  W_WING = "W_WING",
  UNIQUE_RECTANGLE = "UNIQUE_RECTANGLE",
  BUG_PLUS_1 = "BUG_PLUS_1",
  XY_CHAIN = "XY_CHAIN",
  X_CHAIN = "X_CHAIN",
  X_CYCLE = "X_CYCLE",
  FISH_44 = "FISH_44",
  FISH_55 = "FISH_55",
  FISH_66 = "FISH_66",
  FISH_77 = "FISH_77",
  FISH_88 = "FISH_88",
}

export type TechniqueDescriptor = {
  id: TechniqueId;
  label: string;
};

export const TECHNIQUE_LABELS = [
  { id: TechniqueId.FULL_HOUSE, label: "フルハウス" },
  { id: TechniqueId.SINGLE, label: "シングル" },
  { id: TechniqueId.HIDDEN_SINGLE, label: "隠れシングル" },
  { id: TechniqueId.SOLUTION_SYNC, label: "正解同期" },
  { id: TechniqueId.PENCIL_MARK, label: "ペンシルマーク" },
  { id: TechniqueId.MEMO_SINGLE, label: "メモ1確定" },
  { id: TechniqueId.POINTING, label: "ポインティング" },
  { id: TechniqueId.BOX_LINE_REDUCTION, label: "ボックス・ライン削減" },
  { id: TechniqueId.PAIR, label: "ペア" },
  { id: TechniqueId.TRIPLE, label: "トリプル" },
  { id: TechniqueId.QUAD, label: "クァッド" },
  { id: TechniqueId.HIDDEN_PAIR, label: "隠れペア" },
  { id: TechniqueId.HIDDEN_TRIPLE, label: "隠れトリプル" },
  { id: TechniqueId.HIDDEN_QUAD, label: "隠れクァッド" },
  { id: TechniqueId.FISH_22, label: "fish22（X-Wing）" },
  { id: TechniqueId.FISH_33, label: "fish33（Swordfish）" },
  { id: TechniqueId.SKYSCRAPER, label: "スカイスクレーパー" },
  { id: TechniqueId.TWO_STRING_KITE, label: "ツーストリング・カイト" },
  { id: TechniqueId.TURBO_FISH, label: "ターボフィッシュ" },
  { id: TechniqueId.XY_WING, label: "XY-Wing" },
  { id: TechniqueId.XYZ_WING, label: "XYZ-Wing" },
  { id: TechniqueId.WXYZ_WING, label: "WXYZ-Wing" },
  { id: TechniqueId.W_WING, label: "W-Wing" },
  { id: TechniqueId.UNIQUE_RECTANGLE, label: "ユニーク長方形" },
  { id: TechniqueId.BUG_PLUS_1, label: "BUG+1" },
  { id: TechniqueId.XY_CHAIN, label: "XY-Chain" },
  { id: TechniqueId.X_CHAIN, label: "X-Chain" },
  { id: TechniqueId.X_CYCLE, label: "X-Cycle" },
  { id: TechniqueId.FISH_44, label: "fish44（Jellyfish）" },
  { id: TechniqueId.FISH_55, label: "fish55" },
  { id: TechniqueId.FISH_66, label: "fish66" },
  { id: TechniqueId.FISH_77, label: "fish77" },
  { id: TechniqueId.FISH_88, label: "fish88" },
] as const satisfies readonly TechniqueDescriptor[];

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

/** 技法が 1 回の適用で返す結果（変更があったセルの index と、その後の盤） */
export type TechniqueApplyResult = {
  cellIndex: number[];
  grid: SudokuGrid;
};

/** 自動実行で 1 回適用された手のログ */
export type TechniqueAutoRunStep = {
  techniqueId: TechniqueId;
  cellIndex: number[];
  grid: SudokuGrid;
};

/** 自動実行の結果 */
export type TechniqueAutoRunResult = {
  grid: SudokuGrid;
  steps: TechniqueAutoRunStep[];
  finishedBecauseNoChange: boolean;
};
