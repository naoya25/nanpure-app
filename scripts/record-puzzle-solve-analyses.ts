/**
 * DB の全ナンプレを取得し、テクニックランナーを実行して
 * `puzzle_solve_analyses` / `puzzle_solve_technique_usage` に記録する CLI。
 *
 * 前提: `puzzle_solve_records.sql` と `puzzle_solve_analysis_rpc.sql` を Supabase に適用済み。
 *
 * 使い方:
 *   npx tsx scripts/record-puzzle-solve-analyses.ts
 *   npx tsx scripts/record-puzzle-solve-analyses.ts --dry-run
 *   npx tsx scripts/record-puzzle-solve-analyses.ts --page-size=500
 *
 * 環境変数: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`（.env.local）
 *
 * 注意: 再実行するたびに同一 `puzzle_id` 向けに **新しい分析行** が追加されます（上書きしません）。
 */

import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";

import { insertPuzzleSolveAnalysisWithUsage } from "@/lib/repositories/insert_puzzle_solve_analysis";
import {
  list_puzzle_rows_minimal,
  type PuzzleRowMinimal,
} from "@/lib/repositories/list_puzzle_rows_minimal";
import { summarizeTechniqueAutoRunFromStrings } from "@/lib/models/puzzle_technique_run_analysis";
import { TECHNIQUE_LABELS, type TechniqueId } from "@/lib/types/sudoku_technique_types";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });

const DEFAULT_PAGE_SIZE = 200;
const SCRIPT_SOURCE = "record-puzzle-solve-analyses";

function parseArgs(argv: string[]): {
  pageSize: number;
  dryRun: boolean;
} {
  const pageArg = argv.find((a) => a.startsWith("--page-size="));
  let pageSize = DEFAULT_PAGE_SIZE;
  if (pageArg) {
    const n = Number.parseInt(pageArg.slice("--page-size=".length), 10);
    if (!Number.isFinite(n) || n < 1 || n > 1000) {
      throw new Error("--page-size は 1〜1000 の整数にしてください");
    }
    pageSize = n;
  }
  const dryRun = argv.includes("--dry-run");
  return { pageSize, dryRun };
}

function readSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が必要です（.env.local を確認）",
    );
  }
  return { url, anonKey };
}

function usageRowsFromStepCounts(
  counts: Partial<Record<TechniqueId, number>>,
): { technique_id: TechniqueId; step_count: number }[] {
  return TECHNIQUE_LABELS.map(({ id }) => ({
    technique_id: id,
    step_count: counts[id] ?? 0,
  })).filter((r) => r.step_count > 0);
}

function analyzeOne(row: PuzzleRowMinimal): {
  solved: boolean;
  empty_cells_remaining: number;
  finished_because_no_change: boolean;
  conflict_cell_count: number;
  usage: { technique_id: TechniqueId; step_count: number }[];
} {
  const s = summarizeTechniqueAutoRunFromStrings(row.puzzle_81, row.solution_81);
  return {
    solved: s.solved,
    empty_cells_remaining: s.empty_cells_remaining,
    finished_because_no_change: s.finished_because_no_change,
    conflict_cell_count: s.conflict_cell_count,
    usage: usageRowsFromStepCounts(s.techniqueStepCounts),
  };
}

async function main(): Promise<void> {
  const { pageSize, dryRun } = parseArgs(process.argv.slice(2));
  const { url, anonKey } = readSupabaseEnv();
  const supabase = createClient(url, anonKey);

  let rangeFrom = 0;
  let totalProcessed = 0;
  let totalInserted = 0;

  for (;;) {
    const rows = await list_puzzle_rows_minimal(
      supabase,
      rangeFrom,
      rangeFrom + pageSize - 1,
    );
    if (rows.length === 0) break;

    for (const row of rows) {
      const a = analyzeOne(row);
      totalProcessed += 1;

      if (dryRun) {
        console.log(
          `[dry-run] puzzle=${row.id} solved=${a.solved} empty=${a.empty_cells_remaining} ` +
            `finished_no_change=${a.finished_because_no_change} conflict=${a.conflict_cell_count} ` +
            `usage=${JSON.stringify(a.usage)}`,
        );
        continue;
      }

      await insertPuzzleSolveAnalysisWithUsage(supabase, {
        puzzle_id: row.id,
        source: SCRIPT_SOURCE,
        solved: a.solved,
        empty_cells_remaining: a.empty_cells_remaining,
        finished_because_no_change: a.finished_because_no_change,
        conflict_cell_count: a.conflict_cell_count,
        usage: a.usage,
      });
      totalInserted += 1;
      console.log(`inserted analysis for puzzle ${row.id} (${totalInserted})`);
    }

    if (rows.length < pageSize) break;
    rangeFrom += pageSize;
  }

  console.log(
    dryRun
      ? `完了（dry-run）: 処理対象 ${totalProcessed} 件`
      : `完了: 処理 ${totalProcessed} 件、DB 挿入 ${totalInserted} 件`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
