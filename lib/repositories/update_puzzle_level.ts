import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `public.puzzles.level` のみ更新（1..100）。PostgREST / 通信エラーは **throw**。
 */
export async function updatePuzzleLevel(
  supabase: SupabaseClient,
  puzzleId: string,
  level: number,
): Promise<void> {
  if (!Number.isInteger(level) || level < 1 || level > 100) {
    throw new Error("updatePuzzleLevel: level は 1..100 の整数にしてください");
  }
  const { error } = await supabase.from("puzzles").update({ level }).eq("id", puzzleId);
  if (error) {
    throw error;
  }
}
