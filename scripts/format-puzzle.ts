/**
 * 81文字のナンプレ盤面（`0` = 空）を、人間が見やすい形式で出力する CLI。
 *
 * 使い方:
 *   npx tsx scripts/format-puzzle.ts <puzzle_81>
 *
 * stdin から読むこともできます:
 *   echo "<puzzle_81>" | npx tsx scripts/format-puzzle.ts
 */
import { parsePuzzle81 } from "@/lib/validates/grid";

const SEPARATOR = "+-------+-------+-------+";

function formatRow(rowValues: readonly number[]): string {
  const cells = rowValues.map((v) => (v === 0 ? "." : String(v)));
  const g1 = cells.slice(0, 3).join(" ");
  const g2 = cells.slice(3, 6).join(" ");
  const g3 = cells.slice(6, 9).join(" ");
  return `| ${g1} | ${g2} | ${g3} |`;
}

async function readPuzzle81FromCliOrStdin(): Promise<string> {
  const arg = process.argv[2]?.trim();
  if (arg) return arg;

  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(String(chunk));
  }
  const fromStdin = chunks.join("").trim();
  if (!fromStdin) {
    throw new Error("puzzle_81 を指定してください（引数または stdin）");
  }
  return fromStdin;
}

async function main(): Promise<void> {
  const puzzle81 = await readPuzzle81FromCliOrStdin();
  const parsed = parsePuzzle81(puzzle81);

  console.log(SEPARATOR);
  for (let r = 0; r < 9; r++) {
    const row = parsed.values.slice(r * 9, r * 9 + 9);
    console.log(formatRow(row));
    if (r % 3 === 2) console.log(SEPARATOR);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
