import type { SudokuGrid } from "@/lib/models/sudoku_grid";

/** 難易度の低い順チェーン（適用順）のためのテクニック ID */
export enum TechniqueId {
  FULL_HOUSE = "FULL_HOUSE",
  SINGLE = "SINGLE",
  HIDDEN_SINGLE = "HIDDEN_SINGLE",
  SOLUTION_SYNC = "SOLUTION_SYNC",
  PENCIL_MARK = "PENCIL_MARK",
  POINTING = "POINTING",
  BOX_LINE_REDUCTION = "BOX_LINE_REDUCTION",
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
  { id: TechniqueId.POINTING, label: "ポインティング" },
  { id: TechniqueId.BOX_LINE_REDUCTION, label: "ボックス・ライン削減" },
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
