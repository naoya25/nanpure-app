import type { SupabaseClient } from "@supabase/supabase-js";

import type { PuzzleRow } from "@/lib/types/puzzle";

/**
 * `puzzles` から id のみ一覧取得 → 1 件ランダム選択 → その id で 1 行取得（RPC なし）。
 * PostgREST / 通信エラーは **そのまま throw**（Success / Failure の判別は service 層）。
 * 行が無い・取得中に消えた場合は `null`。
 */
export async function get_random_puzzle(
  supabase: SupabaseClient,
): Promise<PuzzleRow | null> {
  const { data: idRows, error: idsError } = await supabase
    .from("puzzles")
    .select("id");

  if (idsError) {
    throw idsError;
  }

  if (!idRows?.length) {
    return null;
  }

  const picked = idRows[Math.floor(Math.random() * idRows.length)];
  if (!picked?.id) {
    return null;
  }

  const { data: row, error: rowError } = await supabase
    .from("puzzles")
    .select("*")
    .eq("id", picked.id)
    .maybeSingle();

  if (rowError) {
    throw rowError;
  }

  if (!row) {
    return null;
  }

  return row as PuzzleRow;
}
