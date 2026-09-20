export const PUZZLE_LEVEL_MIN = 1;
export const PUZZLE_LEVEL_MAX = 200;

export type Puzzle = {
  puzzle_81: string;
  solution_81: string;
  /** 1..200。解けた帯の目安は 1–100 付近、未解決は 100 + 空マスで 100 を超えうる */
  level: number;
};
