/**
 * ナンプレを生成し `public.puzzles` に保存する CLI。
 *
 * 使い方:
 *   npx tsx scripts/create-puzzle.ts
 *   npx tsx scripts/create-puzzle.ts --count=5
 *
 * 環境変数（`.env.local` を読み込み）: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 */

import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";

import { insertPuzzleRow } from "@/lib/repositories/insert_puzzle_row";
import { generateSudokuPuzzlePair } from "@/lib/algorithms/generate_sudoku";

loadDotenv({ path: path.resolve(process.cwd(), ".env.local") });

// TODO: 難易度判定は後で実装
const GENERATED_PUZZLE_LEVEL_PLACEHOLDER = 50;

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

    try {
      const { id } = await insertPuzzleRow(supabase, {
        puzzle_81: pair.puzzle_81,
        solution_81: pair.solution_81,
        level: GENERATED_PUZZLE_LEVEL_PLACEHOLDER,
        description: null,
      });
      console.log(`[${i + 1}/${count}] inserted puzzles.id=${id}`);
    } catch (e) {
      console.error(`[${i + 1}/${count}] Supabase insert 失敗:`, e);
      process.exitCode = 1;
      return;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
