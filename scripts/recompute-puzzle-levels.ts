/**
 * DB の全ナンプレについてテクニック runner + 難易度スコアで `level`（`PUZZLE_LEVEL_MIN`..`PUZZLE_LEVEL_MAX`）を再計算して更新する。
 *
 * 前提:
 * - `puzzles_update_level_policy.sql` を適用済み（anon の UPDATE 許可）
 * - `.env.local` に `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 *
 * 使い方:
 *   npx tsx scripts/recompute-puzzle-levels.ts
 *   npx tsx scripts/recompute-puzzle-levels.ts --dry-run
 *   npx tsx scripts/recompute-puzzle-levels.ts --page-size=300
 */

import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";

import { computeSudokuDifficultyScore } from "@/lib/algorithms/sudoku_difficulty_score";
import { list_puzzle_rows_minimal } from "@/lib/repositories/list_puzzle_rows_minimal";
import { updatePuzzleLevel } from "@/lib/repositories/update_puzzle_level";
import { summarizeTechniqueAutoRunFromStrings } from "@/lib/models/puzzle_technique_run_analysis";
import { clampScoreToPuzzleLevel } from "@/lib/utils/puzzle_level";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });

const DEFAULT_PAGE_SIZE = 200;

function parseArgs(argv: string[]): { pageSize: number; dryRun: boolean } {
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

async function main(): Promise<void> {
  const { pageSize, dryRun } = parseArgs(process.argv.slice(2));
  const { url, anonKey } = readSupabaseEnv();
  const supabase = createClient(url, anonKey);

  let rangeFrom = 0;
  let totalProcessed = 0;
  let totalUpdated = 0;

  for (;;) {
    const rows = await list_puzzle_rows_minimal(
      supabase,
      rangeFrom,
      rangeFrom + pageSize - 1,
    );
    if (rows.length === 0) break;

    for (const row of rows) {
      const summary = summarizeTechniqueAutoRunFromStrings(row.puzzle_81, row.solution_81);
      const score = computeSudokuDifficultyScore({
        techniqueStepCounts: summary.techniqueStepCounts,
        solved: summary.solved,
        ...(summary.solved ? {} : { emptyCellsRemaining: summary.empty_cells_remaining }),
      });
      const level = clampScoreToPuzzleLevel(score.difficultyScore100);
      totalProcessed += 1;

      if (dryRun) {
        const stepTotal = Object.values(summary.techniqueStepCounts).reduce<number>(
          (acc, n) => acc + (n ?? 0),
          0,
        );
        console.log(
          `[dry-run] id=${row.id} level->${level} score100=${score.difficultyScore100} ` +
            `solved=${summary.solved} empty=${summary.empty_cells_remaining} step_total=${stepTotal}`,
        );
        continue;
      }

      await updatePuzzleLevel(supabase, row.id, level);
      totalUpdated += 1;
      console.log(`updated puzzles.id=${row.id} level=${level} (${totalUpdated})`);
    }

    if (rows.length < pageSize) break;
    rangeFrom += pageSize;
  }

  console.log(
    dryRun
      ? `完了（dry-run）: 処理 ${totalProcessed} 件`
      : `完了: 処理 ${totalProcessed} 件、更新 ${totalUpdated} 件`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
