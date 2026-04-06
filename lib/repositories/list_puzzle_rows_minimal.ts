import type { SupabaseClient } from "@supabase/supabase-js";

import type { PuzzleRow } from "@/lib/types/puzzle";

/** 解答分析の入力に足りる `puzzles` の列だけ */
export type PuzzleRowMinimal = Pick<
  PuzzleRow,
  "id" | "puzzle_81" | "solution_81"
>;

/**
 * `puzzles` を `created_at` 昇順でページ取得（`id`, `puzzle_81`, `solution_81` のみ）。
 * PostgREST の `range` は両端含む。通信エラーは **throw**。
 */
export async function list_puzzle_rows_minimal(
  supabase: SupabaseClient,
  rangeFrom: number,
  rangeToInclusive: number,
): Promise<PuzzleRowMinimal[]> {
  const { data, error } = await supabase
    .from("puzzles")
    .select("id, puzzle_81, solution_81")
    .order("created_at", { ascending: true })
    .range(rangeFrom, rangeToInclusive);

  if (error) {
    throw error;
  }

  return (data ?? []) as PuzzleRowMinimal[];
}
