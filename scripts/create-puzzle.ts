/**
 * ナンプレを生成し `public.puzzles` に保存する CLI。
 * 保存前にテクニックランナーを走らせ、`level` を算出してから insert し、
 * 続けて `puzzle_solve_analyses` / `puzzle_solve_technique_usage` に 1 回分を記録する。
 *
 * 前提:
 * - `puzzle_solve_records.sql` と `puzzle_solve_analysis_rpc.sql` を適用済み（分析 RPC）
 * - 問題の insert: 従来どおり anon の insert ポリシー
 * - `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 *
 * 使い方:
 *   npx tsx scripts/create-puzzle.ts
 *   npx tsx scripts/create-puzzle.ts --count=5
 *
 * 注意: 問題の insert 成功後に分析 insert が失敗した場合、分析なしの行だけ残ることがある。そのときは `record-puzzle-solve-analyses` で再記録できる。
 */

import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";

import { computeSudokuDifficultyScore } from "@/lib/algorithms/sudoku_difficulty_score";
import { generateSudokuPuzzlePair } from "@/lib/algorithms/generate_sudoku";
import {
  puzzleSolveAnalysisInsertBodyFromSummary,
  summarizeTechniqueAutoRunFromStrings,
} from "@/lib/models/puzzle_technique_run_analysis";
import { insertPuzzleRow } from "@/lib/repositories/insert_puzzle_row";
import { insertPuzzleSolveAnalysisWithUsage } from "@/lib/repositories/insert_puzzle_solve_analysis";
import { clampScoreToPuzzleLevel } from "@/lib/utils/puzzle_level";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });

const SCRIPT_SOURCE = "create-puzzle";

function parseCount(argv: string[]): number {
  const arg = argv.find((a) => a.startsWith("--count="));
  if (!arg) return 1;
  const n = Number.parseInt(arg.slice("--count=".length), 10);
  if (!Number.isFinite(n) || n < 1 || n > 1000) {
    throw new Error("--count は 1〜1000 の整数にしてください");
  }
  return n;
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
  const count = parseCount(process.argv.slice(2));
  const { url, anonKey } = readSupabaseEnv();
  const supabase = createClient(url, anonKey);

  for (let i = 0; i < count; i++) {
    let pair = null;
    for (let attempt = 0; attempt < 50 && pair === null; attempt++) {
      pair = generateSudokuPuzzlePair(Math.random);
    }
    if (pair === null) {
      console.error(`[${i + 1}/${count}] 生成に失敗しました（再試行上限）`);
      process.exitCode = 1;
      return;
    }

    const summary = summarizeTechniqueAutoRunFromStrings(pair.puzzle_81, pair.solution_81);
    const score = computeSudokuDifficultyScore({
      techniqueStepCounts: summary.techniqueStepCounts,
      solved: summary.solved,
      ...(summary.solved ? {} : { emptyCellsRemaining: summary.empty_cells_remaining }),
    });
    const level = clampScoreToPuzzleLevel(score.difficultyScore100);

    try {
      const { id } = await insertPuzzleRow(supabase, {
        puzzle_81: pair.puzzle_81,
        solution_81: pair.solution_81,
        level,
        description: null,
      });
      console.log(
        `[${i + 1}/${count}] inserted puzzles.id=${id} level=${level} solved=${summary.solved}`,
      );

      const analysisBody = puzzleSolveAnalysisInsertBodyFromSummary(summary);
      const { analysis_id } = await insertPuzzleSolveAnalysisWithUsage(supabase, {
        puzzle_id: id,
        source: SCRIPT_SOURCE,
        ...analysisBody,
      });
      console.log(`  analysis id=${analysis_id}`);
    } catch (e) {
      console.error(`[${i + 1}/${count}] Supabase 失敗:`, e);
      process.exitCode = 1;
      return;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
