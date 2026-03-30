import type {
  TechniqueDescriptor,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";

type TechniquePopoverProps = {
  open: boolean;
  techniques: readonly TechniqueDescriptor[];
  onClose: () => void;
  onApply: (techniqueId: TechniqueId) => void;
};

export function TechniquePopover({
  open,
  techniques,
  onClose,
  onApply,
}: TechniquePopoverProps) {
  if (!open) return null;

  return (
    <div className="absolute bottom-full right-0 z-20 mb-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">テクニック一覧</p>
        <button
          type="button"
          onClick={onClose}
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
            className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200 disabled:pointer-events-none disabled:opacity-40"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
