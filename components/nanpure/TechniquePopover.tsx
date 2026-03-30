import type {
  TechniqueDescriptor,
  TechniqueId,
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

  return (
    <div
      className={[
        "absolute left-1/2 top-full z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2",
        "rounded-lg border border-zinc-200 bg-white p-3 shadow-lg",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">テクニック一覧</p>
        <button
          type="button"
          onClick={onClose}
          onFocus={onFocusAnyControl}
          className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          閉じる
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {techniques.map((t) => (
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
  );
}
