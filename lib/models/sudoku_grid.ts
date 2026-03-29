import { SUDOKU_CELLS } from "@/lib/validates/grid";

/**
 * 1 マス分の状態。確定数字とメモ（候補ビットマスク）をひとまとめにする。
 * bit (d-1) が立っていれば数字 d のメモあり。`value !== 0` のとき `memoMask` は無視してよい。
 */
export type SudokuCell = Readonly<{
  value: number;
  memoMask: number;
}>;

/**
 * プレイ中盤面（81 マス）。更新はすべて新インスタンスを返す（React state 向け）。
 * DB の `puzzle_81` や `parsePuzzle81` の `values[]` とは別層の「UI 用の集約モデル」。
 */
export class SudokuGrid {
  private constructor(private readonly cells: readonly SudokuCell[]) {
    if (cells.length !== SUDOKU_CELLS) {
      throw new Error(`SudokuGrid: expected ${SUDOKU_CELLS} cells`);
    }
  }

  /** 確定値のみから初期化（メモはすべて 0） */
  static fromValues(values: readonly number[]): SudokuGrid {
    return new SudokuGrid(
      Array.from({ length: SUDOKU_CELLS }, (_, i) => ({
        value: values[i] ?? 0,
        memoMask: 0,
      })),
    );
  }

  cellAt(index: number): SudokuCell {
    return this.cells[index];
  }

  /** 正誤判定・ハイライト用に 81 要素の確定値だけを返す */
  values(): readonly number[] {
    return this.cells.map((c) => c.value);
  }

  private withCell(index: number, next: SudokuCell): SudokuGrid {
    return new SudokuGrid(this.cells.map((c, i) => (i === index ? next : c)));
  }

  /** 正解として数字を入れたとき: 確定し、メモを消す */
  placeDigit(index: number, digit: number): SudokuGrid {
    return this.withCell(index, { value: digit, memoMask: 0 });
  }

  /**
   * 誤った数字を入れた直後: マスを空に戻すが、メモはそのまま（従来 UI 挙動）。
   */
  clearValueKeepMemo(index: number): SudokuGrid {
    const c = this.cells[index];
    return this.withCell(index, { ...c, value: 0 });
  }

  /** 空マスに戻し、メモも消す（Backspace / Delete） */
  clearCell(index: number): SudokuGrid {
    return this.withCell(index, { value: 0, memoMask: 0 });
  }

  /** 空マスのメモをトグル。確定マスでは変更しない */
  toggleMemo(index: number, digit: number): SudokuGrid {
    if (digit < 1 || digit > 9) return this;
    const c = this.cells[index];
    if (c.value !== 0) return this;
    const bit = 1 << (digit - 1);
    return this.withCell(index, { ...c, memoMask: c.memoMask ^ bit });
  }
}
