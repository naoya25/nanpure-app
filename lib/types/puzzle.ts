/** DB `puzzles_level_range` と一致（`supabase/migrations/puzzles_level_range_extend.sql`） */
export const PUZZLE_LEVEL_MIN = 1;
export const PUZZLE_LEVEL_MAX = 200;

/** `public.puzzles` の 1 行（Supabase の select 結果に対応） */
export type PuzzleRow = {
  id: string;
  created_at: string;
  puzzle_81: string;
  solution_81: string;
  description: string | null;
  /** 1..200。解けた帯の目安は従来どおり 1–100 付近、未解決は 100 + 空マスで 100 を超えうる */
  level: number;
};
