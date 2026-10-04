import {
  TechniqueId,
  type TechniqueDescriptor,
} from "@/lib/types/sudoku_technique_types";

type AutoRunPopoverProps = {
  open: boolean;
  techniques: readonly TechniqueDescriptor[];
  selectedTechniqueIds: ReadonlySet<TechniqueId>;
  onToggleTechniqueSelection: (techniqueId: TechniqueId) => void;
  onSelectAllTechniqueSelections: () => void;
  onSelectBasicTechniqueSelections: () => void;
  onRun: () => void;
  canRun: boolean;
  onClose: () => void;
  onFocusAnyControl: () => void;
};

const PRESET_BUTTON_CLASS =
  "min-h-9 touch-manipulation rounded-full border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50";

/** 自動実行で使うテクニックを選ぶ。選択は保存され、次からは自動実行ボタンの 1 タップで使われる */
export function AutoRunPopover({
  open,
  techniques,
  selectedTechniqueIds,
  onToggleTechniqueSelection,
  onSelectAllTechniqueSelections,
  onSelectBasicTechniqueSelections,
  onRun,
  canRun,
  onClose,
  onFocusAnyControl,
}: AutoRunPopoverProps) {
  if (!open) return null;

  const needsMemo = (id: TechniqueId) =>
    id !== TechniqueId.FULL_HOUSE &&
    id !== TechniqueId.SINGLE &&
    id !== TechniqueId.HIDDEN_SINGLE &&
    id !== TechniqueId.PENCIL_MARK;
  const basicTechniques = techniques.filter((t) => !needsMemo(t.id));
  const memoTechniques = techniques.filter((t) => needsMemo(t.id));

  const renderChip = (t: TechniqueDescriptor) => {
    const selected = selectedTechniqueIds.has(t.id);
    return (
      <button
        key={t.id}
        type="button"
        aria-pressed={selected}
        onClick={() => onToggleTechniqueSelection(t.id)}
        onFocus={onFocusAnyControl}
        className={[
          "min-h-10 touch-manipulation rounded-full border px-3 text-sm font-medium transition-colors",
          selected
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
        ].join(" ")}
      >
        {t.label}
      </button>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-950/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auto-run-popover-title"
        className={[
          "fixed left-1/2 top-1/2 z-50 flex w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col",
          "max-h-[min(85vh,36rem)] rounded-xl border border-zinc-200 bg-white shadow-lg",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <p
            id="auto-run-popover-title"
            className="text-base font-semibold text-zinc-900"
          >
            自動実行の設定
          </p>
          <button
            type="button"
            onClick={onClose}
            onFocus={onFocusAnyControl}
            aria-label="閉じる"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-2">
          <p className="text-xs leading-relaxed text-zinc-500">
            自動で進めるテクニックを選びます。選択は保存され、次からは自動実行ボタンを押すだけで使われます。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSelectBasicTechniqueSelections}
              onFocus={onFocusAnyControl}
              className={PRESET_BUTTON_CLASS}
            >
              基本だけにする
            </button>
            <button
              type="button"
              onClick={onSelectAllTechniqueSelections}
              onFocus={onFocusAnyControl}
              className={PRESET_BUTTON_CLASS}
            >
              すべて選ぶ
            </button>
          </div>

          <p className="mt-4 text-xs font-semibold text-zinc-700">基本</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {basicTechniques.map(renderChip)}
          </div>

          <p className="mt-4 text-xs font-semibold text-zinc-700">
            メモを使うテクニック
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            空きマスすべてにメモがあるときだけ働きます（ペンシルマークが先に書き込みます）。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {memoTechniques.map(renderChip)}
          </div>
        </div>

        <div className="border-t border-zinc-200 p-3">
          <button
            type="button"
            onClick={onRun}
            onFocus={onFocusAnyControl}
            disabled={!canRun}
            className="min-h-11 w-full touch-manipulation rounded-md bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
          >
            選んだ {selectedTechniqueIds.size} 個で実行
          </button>
        </div>
      </div>
    </>
  );
}
