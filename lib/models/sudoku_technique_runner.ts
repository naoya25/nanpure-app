import { tryFullHouseStep } from "@/lib/algorithms/techniques/full_house";
import { tryHiddenSingleStep } from "@/lib/algorithms/techniques/hidden_single";
import { tryNakedSingleStep } from "@/lib/algorithms/techniques/naked_single";
import { SudokuGrid } from "@/lib/models/sudoku_grid";
import type {
  TechniqueId,
  TechniqueStepResult,
  TechniqueApplyResult,
} from "@/lib/types/sudoku_technique_types";

type TryTechnique = (grid: SudokuGrid) => TechniqueApplyResult | null;

const TECHNIQUE_CHAIN_ORDER: readonly TechniqueId[] = [
  "fullHouse",
  "nakedSingle",
  "hiddenSingle",
];

const TRY_BY_ID: Record<TechniqueId, TryTechnique> = {
  fullHouse: tryFullHouseStep,
  nakedSingle: tryNakedSingleStep,
  hiddenSingle: tryHiddenSingleStep,
};

/**
 * `SudokuGrid` を扱う論理 1 手の窓口。内部で `lib/algorithms/techniques` を呼ぶ。
 */
export class SudokuTechniqueRunner {
  /**
   * 候補を確定数字だけから再計算してから、チェーン順で最初の 1 手だけ適用する。
   * 適用なしの場合は `applied: false`（`grid` は同期済み盤）。
   */
  static applyFirstInChain(grid: SudokuGrid): TechniqueStepResult {
    const synced = grid.withLogicCandidatesSyncedFromValues();
    return SudokuTechniqueRunner.tryChainFromSynced(
      synced,
      TECHNIQUE_CHAIN_ORDER,
    );
  }

  /**
   * 候補を同期したうえで、指定 ID のテクニックだけ 1 手試す。
   */
  static applyByTechniqueId(
    grid: SudokuGrid,
    techniqueId: TechniqueId,
  ): TechniqueStepResult {
    const synced = grid.withLogicCandidatesSyncedFromValues();
    return SudokuTechniqueRunner.tryChainFromSynced(synced, [techniqueId]);
  }

  /** ヒント用: チェーンで最初に当たる手のメタだけ（盤は変えない） */
  static peekFirstInChain(
    grid: SudokuGrid,
  ): Omit<Extract<TechniqueStepResult, { applied: true }>, "grid"> | null {
    const synced = grid.withLogicCandidatesSyncedFromValues();
    for (const id of TECHNIQUE_CHAIN_ORDER) {
      const res = TRY_BY_ID[id](synced);
      if (res) {
        return {
          applied: true,
          techniqueId: id,
          cellIndex: res.cellIndex,
        };
      }
    }
    return null;
  }

  private static tryChainFromSynced(
    syncedGrid: SudokuGrid,
    order: readonly TechniqueId[],
  ): TechniqueStepResult {
    for (const id of order) {
      const res = TRY_BY_ID[id](syncedGrid);
      if (res) {
        return {
          applied: true,
          techniqueId: id,
          cellIndex: res.cellIndex,
          grid: res.grid,
        };
      }
    }
    return { applied: false, grid: syncedGrid };
  }
}
