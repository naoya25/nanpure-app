/** `public.puzzles` の 1 行（Supabase の select 結果に対応） */
export type PuzzleRow = {
  id: string;
  created_at: string;
  puzzle_81: string;
  solution_81: string;
  description: string | null;
  /** 1..100。帯の目安: 初級 1–20 / 中級 21–50 / 上級 51–100 */
  level: number;
};
