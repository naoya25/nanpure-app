import { SudokuGrid } from "@/lib/models/sudoku_grid";

/** undo スタックに積む最大件数（現在の盤は含めない） */
export const PLAY_HISTORY_MAX_PAST = 50;

/**
 * プレイ中の盤面の undo / redo 履歴。
 * {@link SudokuGrid} のスナップショットを保持し、React state ではインスタンスを差し替える。
 */
export class PlayHistory {
  private constructor(
    readonly past: readonly SudokuGrid[],
    readonly present: SudokuGrid,
    readonly future: readonly SudokuGrid[],
  ) {}

  static create(initial: SudokuGrid): PlayHistory {
    return new PlayHistory([], initial, []);
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
  recordNext(next: SudokuGrid): PlayHistory {
    if (next === this.present) return this;
    const past = [...this.past, this.present];
    const trimmed =
      past.length > PLAY_HISTORY_MAX_PAST
        ? past.slice(-PLAY_HISTORY_MAX_PAST)
        : past;
    return new PlayHistory(trimmed, next, []);
  }

  undo(): PlayHistory {
    if (!this.canUndo) return this;
    const prev = this.past[this.past.length - 1]!;
    const past = this.past.slice(0, -1);
    const future = [this.present, ...this.future];
    return new PlayHistory(past, prev, future);
  }

  redo(): PlayHistory {
    if (!this.canRedo) return this;
    const [next, ...futureRest] = this.future;
    const past = [...this.past, this.present];
    const trimmed =
      past.length > PLAY_HISTORY_MAX_PAST
        ? past.slice(-PLAY_HISTORY_MAX_PAST)
        : past;
    return new PlayHistory(trimmed, next, futureRest);
  }
}
