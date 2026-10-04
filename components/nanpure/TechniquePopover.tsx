import type {
  TechniqueDescriptor,
  TechniqueId,
} from "@/lib/types/sudoku_technique_types";

type TechniquePopoverProps = {
  open: boolean;
  /** 今の盤面で 1 手進められるテクニック（表示順は呼び出し側で決める） */
  techniques: readonly TechniqueDescriptor[];
  onClose: () => void;
  onApply: (techniqueId: TechniqueId) => void;
  onFocusAnyControl: () => void;
};

/** ヒント: 今の盤面で使えるテクニックの一覧。押したテクニックで 1 手進める */
export function TechniquePopover({
  open,
  techniques,
  onClose,
  onApply,
  onFocusAnyControl,
}: TechniquePopoverProps) {
  if (!open) return null;

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
        aria-labelledby="technique-popover-title"
        className={[
          "fixed left-1/2 top-1/2 z-50 w-[min(20rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "max-h-[min(85vh,28rem)] overflow-y-auto overscroll-contain",
          "rounded-lg border border-zinc-200 bg-white p-3 shadow-lg",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p
            id="technique-popover-title"
            className="text-sm font-semibold text-zinc-900"
          >
            使えるテクニック
          </p>
          <button
            type="button"
            onClick={onClose}
            onFocus={onFocusAnyControl}
            className="rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            閉じる
          </button>
        </div>
        <p className="mb-3 text-xs leading-snug text-zinc-500">
          この盤面で進められるテクニックです（難しい問題でよく使う順）。押すと、そのテクニックで一手進めます。
        </p>
        <div className="flex flex-wrap gap-2">
          {techniques.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onApply(t.id)}
              onFocus={onFocusAnyControl}
              className="min-h-11 touch-manipulation rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
