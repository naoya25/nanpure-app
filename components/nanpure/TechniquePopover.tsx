import {
  TechniqueId,
  type TechniqueDescriptor,
} from "@/lib/types/sudoku_technique_types";

type TechniquePopoverProps = {
  open: boolean;
  techniques: readonly TechniqueDescriptor[];
  onClose: () => void;
  onApply: (techniqueId: TechniqueId) => void;
  onFocusAnyControl: () => void;
};

export function TechniquePopover({
  open,
  techniques,
  onClose,
  onApply,
  onFocusAnyControl,
}: TechniquePopoverProps) {
  if (!open) return null;

  const pencilIdx = techniques.findIndex((t) => t.id === TechniqueId.PENCIL_MARK);
  const techniquesThroughPencil =
    pencilIdx >= 0 ? techniques.slice(0, pencilIdx + 1) : techniques;
  const techniquesAfterPencil =
    pencilIdx >= 0 ? techniques.slice(pencilIdx + 1) : [];

  return (
    <div
      className={[
        "absolute left-1/2 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2",
        "rounded-lg border border-zinc-200 bg-white p-3 shadow-lg",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">テクニック実行</p>
        <button
          type="button"
          onClick={onClose}
          onFocus={onFocusAnyControl}
          className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          閉じる
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {techniquesThroughPencil.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onApply(t.id)}
              onFocus={onFocusAnyControl}
              className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200"
            >
              {t.label}
            </button>
          ))}
        </div>
        {techniquesAfterPencil.length > 0 ? (
          <div className="border-t border-zinc-200 pt-3">
            <p className="mb-2 text-xs leading-snug text-zinc-500">
              以下は、空マスすべてにペンシルマーク（メモ）がある前提です。
            </p>
            <div className="flex flex-wrap gap-2">
              {techniquesAfterPencil.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onApply(t.id)}
                  onFocus={onFocusAnyControl}
                  className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
