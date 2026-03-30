import { SUDOKU_CELLS, sudokuPeerIndices } from "@/lib/validates/grid";
import { isDigitCorrectForSolution } from "@/lib/validates/validate";

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

  /**
   * 確定値と空マスの論理候補をまとめて指定（テスト・再現用）。
   * 確定マスの `candidateMasks` は無視され memo は 0 になる。
   */
  static fromValuesAndCandidateMasks(
    values: readonly number[],
    candidateMasks: readonly number[],
  ): SudokuGrid {
    if (candidateMasks.length !== SUDOKU_CELLS) {
      throw new Error(
        `fromValuesAndCandidateMasks: expected ${SUDOKU_CELLS} masks`,
      );
    }
    return new SudokuGrid(
      Array.from({ length: SUDOKU_CELLS }, (_, i) => {
        const v = values[i] ?? 0;
        return v !== 0
          ? { value: v, memoMask: 0 }
          : { value: 0, memoMask: candidateMasks[i]! & 0x1ff };
      }),
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

  /**
   * `solution81` の当該マスと照合して正誤を決め、盤を更新する（入口はこれだけでよい）。
   * 一致するときだけ行・列・3×3 のピアから、その数字に対応するメモを消す。不一致のときは当該マスだけ更新しピアは触らない。
   */
  placeDigit(
    index: number,
    digit: number,
    solution81: string,
  ): { next: SudokuGrid; matchesSolution: boolean } {
    if (digit < 1 || digit > 9) {
      return { next: this, matchesSolution: false };
    }
    if (solution81.length !== SUDOKU_CELLS) {
      throw new Error(
        `SudokuGrid.placeDigit: solution81 must be ${SUDOKU_CELLS} chars`,
      );
    }
    const matchesSolution = isDigitCorrectForSolution(digit, solution81, index);
    const next = matchesSolution
      ? this.withPeerMemoClearedForDigit(index, digit)
      : this.withSingleCellDigit(index, digit);
    return { next, matchesSolution };
  }

  /** 当該マスに数字を置き、メモはそのマスのみクリア（ピアは変更しない） */
  private withSingleCellDigit(index: number, digit: number): SudokuGrid {
    return this.withCell(index, { value: digit, memoMask: 0 });
  }

  /**
   * 正解と一致する配置: 当該マスを確定し、ピアから入力数字に対応するメモだけを消す。
   */
  private withPeerMemoClearedForDigit(
    index: number,
    digit: number,
  ): SudokuGrid {
    const bit = 1 << (digit - 1);
    const memoClearMask = 0x1ff & ~bit;
    const peers = sudokuPeerIndices(index);
    const nextCells = this.cells.slice();
    nextCells[index] = { value: digit, memoMask: 0 };
    for (const j of peers) {
      if (j === index) continue;
      const c = nextCells[j];
      nextCells[j] = { ...c, memoMask: c.memoMask & memoClearMask };
    }
    return new SudokuGrid(nextCells);
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

  /**
   * 論理 1 手の確定（正解文字列なし）。空マスかつ候補に digit が含まれること。
   * 確定後、空マスの memo は「旧 memo ∩ 新ルールベース候補」で引き継ぐ。
   */
  assignDeducedDigit(index: number, digit: number): SudokuGrid {
    if (digit < 1 || digit > 9) return this;
    const c = this.cells[index];
    if (c.value !== 0) return this;
    const bit = 1 << (digit - 1);
    if ((c.memoMask & bit) === 0) return this;

    const nextValues = [...this.values()];
    nextValues[index] = digit;

    const nextCells = this.cells.map((cell, i) => {
      if (i === index) return { value: digit, memoMask: 0 };
      if (cell.value !== 0) return { value: cell.value, memoMask: 0 };
      return {
        value: 0,
        memoMask: cell.memoMask,
      };
    });
    return new SudokuGrid(nextCells);
  }

  /**
   * 空マスで、論理候補から 1 数字分だけ削除する（1 手の候補削減）。
   * 変化がなければ this を返す。
   */
  eliminateLogicalCandidate(index: number, digit: number): SudokuGrid {
    if (digit < 1 || digit > 9) return this;
    const c = this.cells[index];
    if (c.value !== 0) return this;
    const bit = 1 << (digit - 1);
    if ((c.memoMask & bit) === 0) return this;
    return this.withCell(index, {
      ...c,
      memoMask: c.memoMask & ~bit,
    });
  }
}
