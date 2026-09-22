import { AutoRunIcon } from "@/components/icons/auto-run-icon";
import { ClearSelectionIcon } from "@/components/icons/clear-selection-icon";
import { RedoIcon } from "@/components/icons/redo-icon";
import { UndoIcon } from "@/components/icons/undo-icon";
import { AutoRunPopover } from "@/components/nanpure/AutoRunPopover";
import type { TechniqueDescriptor, TechniqueId } from "@/lib/types/sudoku_technique_types";

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
  showAutoRunList: boolean;
  onToggleAutoRunList: () => void;
  onCloseAutoRunList: () => void;
  selectedTechniqueIds: ReadonlySet<TechniqueId>;
  onToggleTechniqueSelection: (techniqueId: TechniqueId) => void;
  onSelectAllTechniqueSelections: () => void;
  onAutoRunTechniques: () => void;
  canAutoRunTechniques: boolean;
  techniqueButtons: readonly TechniqueDescriptor[];
  isPlaying: boolean;
  /** 盤の編集・テクニックは不可。undo / redo のみ有効にする（振り返り再生） */
  replayMode?: boolean;
  /** テクニック自動実行のアニメーション再生中。数字・削除・undo/redo・自動実行・ヒントを disabled にする */
  inputLocked?: boolean;
  onHint: () => void;
  canHint: boolean;
  hintMessage: string | null;
  onFocusAnyControl: () => void;
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
  showAutoRunList,
  onToggleAutoRunList,
  onCloseAutoRunList,
  selectedTechniqueIds,
  onToggleTechniqueSelection,
  onSelectAllTechniqueSelections,
  onAutoRunTechniques,
  canAutoRunTechniques,
  techniqueButtons,
  isPlaying,
  replayMode = false,
  inputLocked: playbackLocked = false,
  onHint,
  canHint,
  hintMessage,
  onFocusAnyControl,
}: ControlPadProps) {
  const locked = replayMode || playbackLocked;
  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex w-full max-w-full flex-nowrap items-stretch gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const done = digitComplete[n];
          const disabled = locked || done;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onApplyDigit(n)}
              onFocus={onFocusAnyControl}
              className={[
                "flex min-h-11 min-w-0 flex-1 basis-0 touch-manipulation items-center justify-center rounded-md border border-zinc-200 bg-white text-lg font-bold text-[var(--digit-given)] sm:min-h-12 sm:text-xl",
                locked
                  ? "pointer-events-none opacity-40"
                  : done
                    ? "pointer-events-none invisible"
                    : "active:bg-zinc-100 sm:hover:bg-zinc-50",
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
            disabled={locked}
            onClick={() => onToggleMemo(n)}
            onFocus={onFocusAnyControl}
            className={[
              "flex min-h-11 min-w-0 flex-1 basis-0 touch-manipulation items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-lg font-normal text-[var(--memo)] sm:min-h-12 sm:text-xl",
              locked
                ? "pointer-events-none opacity-40"
                : "active:bg-zinc-100 sm:hover:bg-zinc-100",
            ].join(" ")}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="relative flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={(!replayMode && !isPlaying) || !canUndo || playbackLocked}
            onClick={onUndo}
            onFocus={onFocusAnyControl}
            title="一手戻る"
            aria-label="一手戻る"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
          >
            <UndoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            disabled={locked || !canClearCell}
            onClick={onClearCell}
            onFocus={onFocusAnyControl}
            title="選択中のマスの数字とメモを消す（Backspace でも可）"
            aria-label="選択中のマスの数字とメモを消す"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
          >
            <ClearSelectionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            disabled={(!replayMode && !isPlaying) || !canRedo || playbackLocked}
            onClick={onRedo}
            onFocus={onFocusAnyControl}
            title="一手進める"
            aria-label="一手進める"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
          >
            <RedoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={onToggleAutoRunList}
            onFocus={onFocusAnyControl}
            aria-expanded={showAutoRunList ? "true" : undefined}
            disabled={locked || !isPlaying}
            title="テクニック自動実行の設定"
            aria-label="テクニック自動実行の設定"
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:min-w-12 sm:hover:bg-zinc-100"
          >
            <AutoRunIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={onHint}
            onFocus={onFocusAnyControl}
            disabled={locked || !isPlaying || !canHint}
            title="選択中のテクニックで一手だけ進める"
            aria-label="ヒント"
            className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 active:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 sm:min-h-12 sm:hover:bg-zinc-100"
          >
            ヒント
          </button>
        </div>
        {hintMessage ? (
          <p className="text-xs text-zinc-500">{hintMessage}</p>
        ) : null}
        <AutoRunPopover
          open={showAutoRunList}
          techniques={techniqueButtons}
          selectedTechniqueIds={selectedTechniqueIds}
          onToggleTechniqueSelection={onToggleTechniqueSelection}
          onSelectAllTechniqueSelections={onSelectAllTechniqueSelections}
          onRun={onAutoRunTechniques}
          canRun={canAutoRunTechniques}
          onClose={onCloseAutoRunList}
          onFocusAnyControl={onFocusAnyControl}
        />
      </div>
    </div>
  );
}
