import type { SudokuGrid } from "@/lib/models/sudoku_grid";

/** 難易度の低い順チェーン（適用順）のためのテクニック ID */
export type TechniqueId = "fullHouse" | "single" | "hiddenSingle";

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
