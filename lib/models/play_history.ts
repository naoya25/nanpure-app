import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { TechniqueId } from "@/lib/types/sudoku_technique_types";

export type PlayHistoryEntry = {
  grid: SudokuGrid;
  techniqueId: TechniqueId | null;
  cellIndex: readonly number[] | null;
};

/** undo スタックに積む最大件数（現在の盤は含めない） */

/**
 * プレイ中の盤面の undo / redo 履歴。
 * {@link SudokuGrid} のスナップショットを保持し、React state ではインスタンスを差し替える。
 */
export class PlayHistory {
  private constructor(
    readonly past: readonly PlayHistoryEntry[],
    readonly presentEntry: PlayHistoryEntry,
    readonly future: readonly PlayHistoryEntry[],
  ) {}

  static create(initial: SudokuGrid): PlayHistory {
    return new PlayHistory(
      [],
      { grid: initial, techniqueId: null, cellIndex: null },
      [],
    );
  }

  get present(): SudokuGrid {
    return this.presentEntry.grid;
  }

  get presentTechniqueId(): TechniqueId | null {
    return this.presentEntry.techniqueId;
  }

  get presentCellIndex(): readonly number[] | null {
    return this.presentEntry.cellIndex;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * 操作後の盤を反映する。`next === present` のときは履歴を増やさない。
   * 新しい操作が入ったら redo 用スタックは破棄する。
   */
  recordNext(
    next: SudokuGrid,
    techniqueId: TechniqueId | null = null,
    cellIndex: readonly number[] | null = null,
  ): PlayHistory {
    if (next === this.present) return this;
    const past = [...this.past, this.presentEntry];
    return new PlayHistory(past, { grid: next, techniqueId, cellIndex }, []);
  }

  undo(): PlayHistory {
    if (!this.canUndo) return this;
    const prev = this.past[this.past.length - 1]!;
    const past = this.past.slice(0, -1);
    const future = [this.presentEntry, ...this.future];
    return new PlayHistory(past, prev, future);
  }

  redo(): PlayHistory {
    if (!this.canRedo) return this;
    const [next, ...futureRest] = this.future;
    const past = [...this.past, this.presentEntry];
    return new PlayHistory(past, next, futureRest);
  }

  /**
   * `past` + `presentEntry`（undo で捨てた `future` は含まない）の集計。
   * `PlayHistory.create` の初期エントリ（`cellIndex === null && techniqueId === null`）は除く。
   */
  techniqueUsageOnCurrentPath(): {
    byTechnique: ReadonlyMap<TechniqueId, number>;
    manualSteps: number;
  } {
    const counts = new Map<TechniqueId, number>();
    let manualSteps = 0;
    for (const entry of [...this.past, this.presentEntry]) {
      if (entry.cellIndex === null && entry.techniqueId === null) continue;
      if (entry.techniqueId === null) {
        manualSteps += 1;
        continue;
      }
      counts.set(entry.techniqueId, (counts.get(entry.techniqueId) ?? 0) + 1);
    }

    const byTechnique = new Map<TechniqueId, number>();
    for (const id of Object.values(TechniqueId)) {
      const count = counts.get(id);
      if (count !== undefined) byTechnique.set(id, count);
    }
    return { byTechnique, manualSteps };
  }
}
