/** `public.puzzles` の 1 行（Supabase の select 結果に対応） */
export type PuzzleRow = {
  id: string;
  created_at: string;
  puzzle_81: string;
  solution_81: string;
  description: string | null;
  difficulty_id: number;
};
