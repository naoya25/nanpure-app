import type { SupabaseClient } from "@supabase/supabase-js";

import type { PuzzleRow } from "@/lib/types/puzzle";

export type InsertPuzzleInput = {
  puzzle_81: string;
  solution_81: string;
  level: number;
  /** 省略時は DB 上 `null` */
  description?: string | null;
};

/**
 * `public.puzzles` に 1 行 insert。PostgREST / 通信エラーは **throw**。
 */
export async function insertPuzzleRow(
  supabase: SupabaseClient,
  input: InsertPuzzleInput,
): Promise<Pick<PuzzleRow, "id">> {
  const { data, error } = await supabase
    .from("puzzles")
    .insert({
      puzzle_81: input.puzzle_81,
      solution_81: input.solution_81,
      level: input.level,
      description: input.description ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error("insert puzzles: missing id in response");
  }

  return { id: data.id };
}
