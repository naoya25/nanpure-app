import type { SudokuGrid } from "@/lib/models/sudoku_grid";

/** 難易度の低い順チェーン（適用順）のためのテクニック ID */
export enum TechniqueId {
  FULL_HOUSE = "FULL_HOUSE",
  SINGLE = "SINGLE",
  HIDDEN_SINGLE = "HIDDEN_SINGLE",
}

export type TechniqueDescriptor = {
  id: TechniqueId;
  label: string;
};

export const TECHNIQUE_BUTTONS = [
  { id: TechniqueId.FULL_HOUSE, label: "フルハウス" },
  { id: TechniqueId.SINGLE, label: "シングル" },
  { id: TechniqueId.HIDDEN_SINGLE, label: "隠れシングル" },
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
