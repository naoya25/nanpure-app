import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type { TechniqueId } from "@/lib/types/sudoku_technique_types";

export type PlayHistoryEntry = {
  grid: SudokuGrid;
  techniqueId: TechniqueId | null;
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
    return new PlayHistory([], { grid: initial, techniqueId: null }, []);
  }

  get present(): SudokuGrid {
    return this.presentEntry.grid;
  }

  get presentTechniqueId(): TechniqueId | null {
    return this.presentEntry.techniqueId;
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
  recordNext(next: SudokuGrid, techniqueId: TechniqueId | null = null): PlayHistory {
    if (next === this.present) return this;
    const past = [...this.past, this.presentEntry];
    return new PlayHistory(past, { grid: next, techniqueId }, []);
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
}
