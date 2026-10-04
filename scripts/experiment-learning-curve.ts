/**
 * テクニック学習ページ用の統計を取る CLI。
 * 難易度 100% の問題を全テクニックで解き、問題ごとの「使ったテクニックの集合」を
 * `scripts/experiment-results/*-learning-curve.json` に書き出す。
 * ある集合 S を覚えた人が解ける問題 = 使った集合が S に含まれる問題
 * （使わなかった手筋を外しても runner の解き筋は変わらないため）。
 *
 * 使い方:
 *   npx tsx scripts/experiment-learning-curve.ts --count=1000
 */

import fs from "node:fs";
import path from "node:path";
import { generateSudokuPuzzlePair } from "@/lib/algorithms/generate_sudoku";
import { summarizeTechniqueAutoRunFromStrings } from "@/lib/models/puzzle_technique_run_analysis";
import type { TechniqueId } from "@/lib/types/sudoku_technique_types";

function parseCount(argv: string[]): number {
  const arg = argv.find((a) => a.startsWith("--count="));
  if (!arg) return 1000;
  const n = Number.parseInt(arg.slice("--count=".length), 10);
  if (!Number.isFinite(n) || n < 1 || n > 10000) {
    throw new Error("--count は 1〜10000 の整数にしてください");
  }
  return n;
}

function makeTimestampForFileName(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}`;
}

function main(): void {
  const count = parseCount(process.argv.slice(2));
  const usedSets: TechniqueId[][] = [];
  let unsolved = 0;

  for (let i = 0; i < count; i++) {
    let pair = null;
    for (let attempt = 0; attempt < 100 && pair === null; attempt++) {
      pair = generateSudokuPuzzlePair(Math.random);
    }
    if (pair === null) continue;
    const summary = summarizeTechniqueAutoRunFromStrings(pair.puzzle_81, pair.solution_81);
    if (!summary.solved) {
      unsolved += 1;
      continue;
    }
    usedSets.push(Object.keys(summary.techniqueStepCounts) as TechniqueId[]);
    if ((i + 1) % 100 === 0) console.error(`[${i + 1}/${count}]`);
  }

  const outDir = path.resolve(process.cwd(), "scripts/experiment-results");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(
    outDir,
    `${makeTimestampForFileName(new Date())}-learning-curve.json`,
  );
  fs.writeFileSync(outPath, JSON.stringify({ count, unsolved, usedSets }), "utf8");
  console.log(`saved: ${outPath}`);
}

main();
