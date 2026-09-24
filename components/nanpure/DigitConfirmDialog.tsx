type DigitConfirmDialogProps = {
  digit: number | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DigitConfirmDialog({
  digit,
  onConfirm,
  onCancel,
}: DigitConfirmDialogProps) {
  if (digit === null) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-950/40"
        onClick={onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="digit-confirm-title"
        className={[
          "fixed left-1/2 top-1/2 z-50 w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "rounded-lg border border-zinc-200 bg-white p-4 shadow-lg",
        ].join(" ")}
      >
        <p
          id="digit-confirm-title"
          className="text-base font-semibold text-zinc-900"
        >
          <span className="tabular-nums">{digit}</span> を入力しますか？
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100"
          >
            入力
          </button>
        </div>
      </div>
    </>
  );
}
