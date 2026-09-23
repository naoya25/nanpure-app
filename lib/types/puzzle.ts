export const PUZZLE_LEVEL_MIN = 1;
export const PUZZLE_LEVEL_MAX = 200;

export const DIFFICULTY_PERCENTS = [100, 90, 70, 50] as const;
export type DifficultyPercent = (typeof DIFFICULTY_PERCENTS)[number];
export const DEFAULT_DIFFICULTY_PERCENT: DifficultyPercent = 100;

export function isDifficultyPercent(value: unknown): value is DifficultyPercent {
  return DIFFICULTY_PERCENTS.includes(value as DifficultyPercent);
}

export type Puzzle = {
  puzzle_81: string;
  solution_81: string;
  /** 1..200。解けた帯の目安は 1–100 付近、未解決は 100 + 空マスで 100 を超えうる */
  level: number;
  /** 生成器が空けられる穴の数を 100 としたときに残した割合 */
  difficultyPercent: DifficultyPercent;
};
