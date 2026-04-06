import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { runTechniqueAutoUntilNoChange } from "@/lib/models/sudoku_technique_runner";
import { TECHNIQUE_LABELS, type TechniqueId } from "@/lib/types/sudoku_technique_types";
import { parsePuzzle81 } from "@/lib/validates/grid";

export type TechniqueStepCounts = Partial<Record<TechniqueId, number>>;

/** `puzzle_81` / `solution_81` に対してテクニック自動実行を 1 回走らせた結果の要約 */
export type PuzzleTechniqueRunSummary = {
  techniqueStepCounts: TechniqueStepCounts;
  solved: boolean;
  empty_cells_remaining: number;
  finished_because_no_change: boolean;
  conflict_cell_count: number;
};

function createEmptyCounter(): Record<TechniqueId, number> {
  return Object.fromEntries(
    TECHNIQUE_LABELS.map(({ id }) => [id, 0]),
  ) as Record<TechniqueId, number>;
}

function countEmptyCells(values: readonly number[]): number {
  let n = 0;
  for (const v of values) {
    if (v === 0) n += 1;
  }
  return n;
}

function toPartialCounts(counter: Record<TechniqueId, number>): TechniqueStepCounts {
  const out: TechniqueStepCounts = {};
  for (const id of Object.keys(counter) as TechniqueId[]) {
    const c = counter[id];
    if (c > 0) out[id] = c;
  }
  return out;
}

/**
 * DB 行の `puzzle_81` / `solution_81` を入力に、全テクニック順の自動実行を 1 回行う。
 * CLI や難易度計算で共有する。
 */
export function summarizeTechniqueAutoRunFromStrings(
  puzzle81: string,
  solution81: string,
): PuzzleTechniqueRunSummary {
  const techniqueIds = TECHNIQUE_LABELS.map((t) => t.id);
  const initialGrid = SudokuGrid.fromValues(parsePuzzle81(puzzle81).values);
  const result = runTechniqueAutoUntilNoChange(
    initialGrid,
    techniqueIds,
    solution81,
  );

  const counter = createEmptyCounter();
  for (const step of result.steps) {
    counter[step.techniqueId] += 1;
  }

  const values = result.grid.values();
  const solved = values.join("") === solution81;

  return {
    techniqueStepCounts: toPartialCounts(counter),
    solved,
    empty_cells_remaining: countEmptyCells(values),
    finished_because_no_change: result.finishedBecauseNoChange,
    conflict_cell_count: result.conflictCellIndex?.length ?? 0,
  };
}
