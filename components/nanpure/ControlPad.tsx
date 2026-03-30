import { ClearSelectionIcon } from "@/components/icons/clear-selection-icon";
import { PlayIcon } from "@/components/icons/play-icon";
import { RedoIcon } from "@/components/icons/redo-icon";
import { UndoIcon } from "@/components/icons/undo-icon";
import { TechniquePopover } from "@/components/nanpure/TechniquePopover";
import type { TechniqueDescriptor } from "@/lib/models/sudoku_technique_runner";
import type { TechniqueId } from "@/lib/types/sudoku_technique_types";

type ControlPadProps = {
  digitComplete: readonly boolean[];
  onApplyDigit: (digit: number) => void;
  onToggleMemo: (digit: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  canClearCell: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearCell: () => void;
  showTechniqueList: boolean;
  onToggleTechniqueList: () => void;
  onCloseTechniqueList: () => void;
  onApplyTechnique: (techniqueId: TechniqueId) => void;
  techniqueButtons: readonly TechniqueDescriptor[];
  isPlaying: boolean;
};

export function ControlPad({
  digitComplete,
  onApplyDigit,
  onToggleMemo,
  canUndo,
  canRedo,
  canClearCell,
  onUndo,
  onRedo,
  onClearCell,
  showTechniqueList,
  onToggleTechniqueList,
  onCloseTechniqueList,
  onApplyTechnique,
  techniqueButtons,
  isPlaying,
}: ControlPadProps) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex w-full max-w-full flex-nowrap items-stretch gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const done = digitComplete[n];
          return (
            <button
              key={n}
              type="button"
              disabled={done}
              onClick={() => onApplyDigit(n)}
              className={[
                "flex min-h-11 min-w-0 flex-1 basis-0 touch-manipulation items-center justify-center rounded-md text-lg font-semibold sm:min-h-12 sm:text-xl",
                done
                  ? "pointer-events-none invisible"
                  : "text-zinc-900 active:bg-zinc-100 sm:hover:bg-zinc-50",
              ].join(" ")}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex w-full max-w-full flex-nowrap items-stretch gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onToggleMemo(n)}
            className="flex min-h-11 min-w-0 flex-1 basis-0 touch-manipulation items-center justify-center rounded-md text-lg font-semibold text-zinc-500 active:bg-zinc-100 sm:min-h-12 sm:text-xl sm:hover:bg-zinc-50"
          >
            {n}
          </button>
        ))}
      </div>
      <div className="relative flex items-center justify-center gap-2">
        <TechniquePopover
          open={showTechniqueList}
          techniques={techniqueButtons}
          onClose={onCloseTechniqueList}
          onApply={onApplyTechnique}
        />
        <button
          type="button"
          disabled={!isPlaying || !canUndo}
          onClick={onUndo}
          title="一手戻る"
          aria-label="一手戻る"
          className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
        >
          <UndoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          disabled={!canClearCell}
          onClick={onClearCell}
          title="選択中のマスの数字とメモを消す（Backspace でも可）"
          aria-label="選択中のマスの数字とメモを消す"
          className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
        >
          <ClearSelectionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          disabled={!isPlaying || !canRedo}
          onClick={onRedo}
          title="一手進める"
          aria-label="一手進める"
          className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
        >
          <RedoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          onClick={onToggleTechniqueList}
          aria-expanded={showTechniqueList ? "true" : undefined}
          disabled={!isPlaying}
          title="テクニックを実行"
          aria-label="テクニックを実行"
          className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-900 text-white active:bg-zinc-700 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-800"
        >
          <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    </div>
  );
}
