/**
 * ナンプレ難易度判定の前段として、テクニック使用統計を収集する CLI。
 *
 * 使い方:
 *   npx tsx scripts/experiment-technique-stats.ts
 *   npx tsx scripts/experiment-technique-stats.ts --count=100
 */

import fs from "node:fs";
import path from "node:path";
import { generateSudokuPuzzlePair } from "@/lib/algorithms/generate_sudoku";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { runTechniqueAutoUntilNoChange } from "@/lib/models/sudoku_technique_runner";
import {
  TECHNIQUE_LABELS,
  type TechniqueId,
} from "@/lib/types/sudoku_technique_types";
import { parsePuzzle81 } from "@/lib/validates/grid";

type UsageCounter = Record<TechniqueId, number>;

function parseCount(argv: string[]): number {
  const arg = argv.find((a) => a.startsWith("--count="));
  if (!arg) return 30;
  const n = Number.parseInt(arg.slice("--count=".length), 10);
  if (!Number.isFinite(n) || n < 1 || n > 10000) {
    throw new Error("--count は 1〜10000 の整数にしてください");
  }
  return n;
}

function createEmptyCounter(): UsageCounter {
  return Object.fromEntries(
    TECHNIQUE_LABELS.map(({ id }) => [id, 0]),
  ) as UsageCounter;
}

function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "-";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function formatAvg(totalCount: number, denominator: number): string {
  if (denominator <= 0) return "-";
  return (totalCount / denominator).toFixed(2);
}

function makeTimestampForFileName(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${hh}-${min}`;
}

function chooseOutputPath(baseDir: string, timestamp: string): string {
  const base = path.join(baseDir, `${timestamp}.md`);
  if (!fs.existsSync(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = path.join(baseDir, `${timestamp}-${i}.md`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  throw new Error("結果ファイル名の採番に失敗しました");
}

async function main(): Promise<void> {
  const count = parseCount(process.argv.slice(2));
  const techniqueIds = TECHNIQUE_LABELS.map((t) => t.id);

  const totalCounter = createEmptyCounter();
  const solvedCounter = createEmptyCounter();
  const unsolvedCounter = createEmptyCounter();
  const totalUsedPuzzles = createEmptyCounter();
  const solvedUsedPuzzles = createEmptyCounter();
  const unsolvedUsedPuzzles = createEmptyCounter();

  let solvedCount = 0;
  let unsolvedCount = 0;
  let generationFailureCount = 0;

  for (let i = 0; i < count; i++) {
    let pair = null;
    for (let attempt = 0; attempt < 100 && pair === null; attempt++) {
      pair = generateSudokuPuzzlePair(Math.random);
    }

    if (pair === null) {
      generationFailureCount += 1;
      console.error(`[${i + 1}/${count}] 問題生成に失敗（再試行上限）`);
      continue;
    }

    const initialGrid = SudokuGrid.fromValues(
      parsePuzzle81(pair.puzzle_81).values,
    );
    const result = runTechniqueAutoUntilNoChange(
      initialGrid,
      techniqueIds,
      pair.solution_81,
    );

    const usageInPuzzle = createEmptyCounter();
    for (const step of result.steps) {
      usageInPuzzle[step.techniqueId] += 1;
    }

    const solved = result.grid.values().join("") === pair.solution_81;
    if (solved) {
      solvedCount += 1;
    } else {
      unsolvedCount += 1;
    }

    for (const id of techniqueIds) {
      const c = usageInPuzzle[id];
      totalCounter[id] += c;
      if (solved) {
        solvedCounter[id] += c;
      } else {
        unsolvedCounter[id] += c;
      }

      if (c > 0) {
        totalUsedPuzzles[id] += 1;
        if (solved) {
          solvedUsedPuzzles[id] += 1;
        } else {
          unsolvedUsedPuzzles[id] += 1;
        }
      }
    }
  }

  const analyzedCount = solvedCount + unsolvedCount;

  const lines: string[] = [];
  lines.push("# テクニック実験結果");
  lines.push("");
  lines.push("## サマリー");
  lines.push("");
  lines.push(`- 生成目標数: ${count}`);
  lines.push(`- 集計対象数: ${analyzedCount}`);
  lines.push(`- 生成失敗数: ${generationFailureCount}`);
  lines.push(`- 解けた問題数: ${solvedCount}`);
  lines.push(`- 解けなかった問題数: ${unsolvedCount}`);
  lines.push("");
  lines.push("## テクニック統計");
  lines.push("");
  lines.push(
    "| technique | 使用率(全体) | 使用率(解けた問題のみ) | 使用率(解けなかった問題のみ) | 平均使用回数(全体) | 平均使用回数(解けた問題のみ) | 平均使用回数(解けなかった問題のみ) |",
  );
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");

  for (const { id } of TECHNIQUE_LABELS) {
    lines.push(
      [
        "|",
        id,
        "|",
        formatPercent(totalUsedPuzzles[id], analyzedCount),
        "|",
        formatPercent(solvedUsedPuzzles[id], solvedCount),
        "|",
        formatPercent(unsolvedUsedPuzzles[id], unsolvedCount),
        "|",
        formatAvg(totalCounter[id], analyzedCount),
        "|",
        formatAvg(solvedCounter[id], solvedCount),
        "|",
        formatAvg(unsolvedCounter[id], unsolvedCount),
        "|",
      ].join(" "),
    );
  }

  const report = `${lines.join("\n")}\n`;
  console.log(report);

  const timestamp = makeTimestampForFileName(new Date());
  const outDir = path.resolve(process.cwd(), "scripts/experiment-results");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = chooseOutputPath(outDir, timestamp);
  fs.writeFileSync(outPath, report, "utf8");
  console.log(`saved: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
