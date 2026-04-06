import type { SupabaseClient } from "@supabase/supabase-js";

import type { TechniqueId } from "@/lib/types/sudoku_technique_types";

export type PuzzleSolveTechniqueUsageInput = {
  technique_id: TechniqueId | string;
  step_count: number;
};

export type InsertPuzzleSolveAnalysisWithUsageInput = {
  puzzle_id: string;
  source?: string | null;
  solved: boolean;
  empty_cells_remaining: number;
  finished_because_no_change: boolean;
  conflict_cell_count: number;
  usage: PuzzleSolveTechniqueUsageInput[];
};

/**
 * `insert_puzzle_solve_analysis_with_usage` RPC で分析とテクニック使用を 1 トランザクションで挿入。
 * PostgREST / 通信エラーは **throw**。
 */
export async function insertPuzzleSolveAnalysisWithUsage(
  supabase: SupabaseClient,
  input: InsertPuzzleSolveAnalysisWithUsageInput,
): Promise<{ analysis_id: string }> {
  const usagePayload = input.usage
    .filter((u) => u.step_count > 0)
    .map((u) => ({
      technique_id: String(u.technique_id),
      step_count: u.step_count,
    }));

  const { data, error } = await supabase.rpc("insert_puzzle_solve_analysis_with_usage", {
    p_puzzle_id: input.puzzle_id,
    p_source: input.source ?? null,
    p_solved: input.solved,
    p_empty_cells_remaining: input.empty_cells_remaining,
    p_finished_because_no_change: input.finished_because_no_change,
    p_conflict_cell_count: input.conflict_cell_count,
    p_usage: usagePayload,
  });

  if (error) {
    throw error;
  }

  if (data === null || data === undefined) {
    throw new Error("insert_puzzle_solve_analysis_with_usage: missing return id");
  }

  return { analysis_id: String(data) };
}
