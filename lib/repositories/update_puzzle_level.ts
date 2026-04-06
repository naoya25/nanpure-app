import type { SupabaseClient } from "@supabase/supabase-js";

import { PUZZLE_LEVEL_MAX, PUZZLE_LEVEL_MIN } from "@/lib/types/puzzle";

/**
 * `public.puzzles.level` のみ更新（`PUZZLE_LEVEL_MIN`..`PUZZLE_LEVEL_MAX`）。PostgREST / 通信エラーは **throw**。
 */
export async function updatePuzzleLevel(
  supabase: SupabaseClient,
  puzzleId: string,
  level: number,
): Promise<void> {
  if (!Number.isInteger(level) || level < PUZZLE_LEVEL_MIN || level > PUZZLE_LEVEL_MAX) {
    throw new Error(
      `updatePuzzleLevel: level は ${PUZZLE_LEVEL_MIN}..${PUZZLE_LEVEL_MAX} の整数にしてください`,
    );
  }
  const { error } = await supabase.from("puzzles").update({ level }).eq("id", puzzleId);
  if (error) {
    throw error;
  }
}
