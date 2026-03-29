import type { SupabaseClient } from "@supabase/supabase-js";

import type { PuzzleRow } from "@/lib/types/puzzle";

/**
 * `puzzles.id` で 1 行取得。
 * PostgREST / 通信エラーは **そのまま throw**。行が無ければ `null`。
 */
export async function get_puzzle_by_id(
  supabase: SupabaseClient,
  id: string,
): Promise<PuzzleRow | null> {
  const { data: row, error: rowError } = await supabase
    .from("puzzles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (rowError) {
    throw rowError;
  }

  if (!row) {
    return null;
  }

  return row as PuzzleRow;
}
