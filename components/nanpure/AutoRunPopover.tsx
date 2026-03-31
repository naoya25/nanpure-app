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
  onRun: () => void;
  canRun: boolean;
  onClose: () => void;
  onFocusAnyControl: () => void;
};

export function AutoRunPopover({
  open,
  techniques,
  selectedTechniqueIds,
  onToggleTechniqueSelection,
  onSelectAllTechniqueSelections,
  onRun,
  canRun,
  onClose,
  onFocusAnyControl,
}: AutoRunPopoverProps) {
  if (!open) return null;

  const pencilIdx = techniques.findIndex((t) => t.id === TechniqueId.PENCIL_MARK);
  const techniquesThroughPencil =
    pencilIdx >= 0 ? techniques.slice(0, pencilIdx + 1) : techniques;
  const techniquesAfterPencil =
    pencilIdx >= 0 ? techniques.slice(pencilIdx + 1) : [];

  const renderCheckboxRow = (t: TechniqueDescriptor) => (
    <li
      key={t.id}
      className="flex items-center rounded-md border border-zinc-100 bg-zinc-50/80 px-2 py-2"
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={selectedTechniqueIds.has(t.id)}
          onChange={() => onToggleTechniqueSelection(t.id)}
          onFocus={onFocusAnyControl}
          className="h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
        />
        <span className="font-medium">{t.label}</span>
      </label>
    </li>
  );

  return (
    <div
      className={[
        "absolute left-1/2 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2",
        "max-h-[min(70vh,22rem)] overflow-y-auto overscroll-contain",
        "rounded-lg border border-zinc-200 bg-white p-3 shadow-lg",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">自動実行の選択</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRun}
            onFocus={onFocusAnyControl}
            disabled={!canRun}
            className="rounded-md border border-zinc-300 bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
          >
            実行
          </button>
          <button
            type="button"
            onClick={onSelectAllTechniqueSelections}
            onFocus={onFocusAnyControl}
            className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            全てにチェック
          </button>
          <button
            type="button"
            onClick={onClose}
            onFocus={onFocusAnyControl}
            className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            閉じる
          </button>
        </div>
      </div>
      <p className="mb-2 text-xs text-zinc-500">
        チェックしたテクニックだけを、定義順（難易度順）で繰り返し適用します。
      </p>
      <ul className="mb-3 flex flex-col gap-2">
        {techniquesThroughPencil.map(renderCheckboxRow)}
        {techniquesAfterPencil.length > 0 ? (
          <li className="list-none py-1">
            <div className="border-t border-zinc-200 pt-3">
              <p className="mb-2 text-xs leading-snug text-zinc-500">
                以下は、空マスすべてにペンシルマーク（メモ）がある前提です。
              </p>
            </div>
          </li>
        ) : null}
        {techniquesAfterPencil.map(renderCheckboxRow)}
      </ul>
    </div>
  );
}
