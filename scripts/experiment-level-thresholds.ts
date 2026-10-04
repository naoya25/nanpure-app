/**
 * Level の目盛り（`SOLVED_RAW_SCORE_LEVEL_THRESHOLDS`）を作る CLI。
 * 難易度 100% の問題を生成して全テクニックで解き、素点 Σ（使用回数 × 希少度）の 1〜99 百分位を出す。
 *
 * 使い方:
 *   npx tsx scripts/experiment-level-thresholds.ts
 *   npx tsx scripts/experiment-level-thresholds.ts --count=1000
 *
 * 出力の配列を `lib/algorithms/sudoku_difficulty_score.ts` の
 * `SOLVED_RAW_SCORE_LEVEL_THRESHOLDS` に貼る。結果は `scripts/experiment-results/` にも保存する。
 */

import fs from "node:fs";
import path from "node:path";
import { generateSudokuPuzzlePair } from "@/lib/algorithms/generate_sudoku";
import { computeSolvedRawScore } from "@/lib/algorithms/sudoku_difficulty_score";
import { summarizeTechniqueAutoRunFromStrings } from "@/lib/models/puzzle_technique_run_analysis";

function parseCount(argv: string[]): number {
  const arg = argv.find((a) => a.startsWith("--count="));
  if (!arg) return 1000;
  const n = Number.parseInt(arg.slice("--count=".length), 10);
  if (!Number.isFinite(n) || n < 100 || n > 10000) {
    throw new Error("--count は 100〜10000 の整数にしてください");
  }
  return n;
}

/** 昇順の配列の q 分位（0〜1）。隣り合う 2 点を線形補間する */
function quantile(sorted: readonly number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

function makeTimestampForFileName(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}`;
}

function main(): void {
  const count = parseCount(process.argv.slice(2));
  const rawScores: number[] = [];
  let unsolved = 0;
  let generationFailures = 0;

  for (let i = 0; i < count; i++) {
    let pair = null;
    for (let attempt = 0; attempt < 100 && pair === null; attempt++) {
      pair = generateSudokuPuzzlePair(Math.random);
    }
    if (pair === null) {
      generationFailures += 1;
      continue;
    }
    const summary = summarizeTechniqueAutoRunFromStrings(pair.puzzle_81, pair.solution_81);
    if (!summary.solved) {
      unsolved += 1;
      continue;
    }
    rawScores.push(computeSolvedRawScore(summary.techniqueStepCounts));
    if ((i + 1) % 100 === 0) console.error(`[${i + 1}/${count}]`);
  }

  rawScores.sort((a, b) => a - b);
  const thresholds = Array.from({ length: 99 }, (_, k) =>
    Number(quantile(rawScores, (k + 1) / 100).toFixed(4)),
  );

  const lines: string[] = [];
  lines.push("# Level の目盛り（素点の百分位）");
  lines.push("");
  lines.push(`- 生成目標数: ${count}（難易度 100%）`);
  lines.push(`- 集計対象（解けた問題）: ${rawScores.length}`);
  lines.push(`- 解けなかった問題: ${unsolved}`);
  lines.push(`- 生成失敗: ${generationFailures}`);
  lines.push("");
  lines.push("## 素点の分布");
  lines.push("");
  lines.push("| 百分位 | 素点 |");
  lines.push("| ---: | ---: |");
  for (const q of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99, 1]) {
    lines.push(`| ${q * 100}% | ${quantile(rawScores, q).toFixed(2)} |`);
  }
  lines.push("");
  lines.push("## SOLVED_RAW_SCORE_LEVEL_THRESHOLDS");
  lines.push("");
  lines.push("```ts");
  for (let k = 0; k < thresholds.length; k += 10) {
    lines.push(`  ${thresholds.slice(k, k + 10).join(", ")},`);
  }
  lines.push("```");

  const report = `${lines.join("\n")}\n`;
  console.log(report);

  const outDir = path.resolve(process.cwd(), "scripts/experiment-results");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(
    outDir,
    `${makeTimestampForFileName(new Date())}-level-thresholds.md`,
  );
  fs.writeFileSync(outPath, report, "utf8");
  console.log(`saved: ${outPath}`);
}

main();
