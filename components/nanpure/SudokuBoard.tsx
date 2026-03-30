import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { isCellMismatchingSolution } from "@/lib/validates/validate";

function cellBorderClasses(index: number): string {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const parts: string[] = [];
  if (col < 8) {
    parts.push(
      col % 3 === 2
        ? "border-r-2 border-r-zinc-600"
        : "border-r border-r-zinc-300",
    );
  }
  if (row < 8) {
    parts.push(
      row % 3 === 2
        ? "border-b-2 border-b-zinc-600"
        : "border-b border-b-zinc-300",
    );
  }
  return parts.join(" ");
}

type CellHighlight = {
  selected: boolean;
  digitMatch: boolean;
  inBand: boolean;
};

function cellHighlights(
  index: number,
  selectedIndex: number | null,
  grid: readonly number[],
): CellHighlight {
  if (selectedIndex === null) {
    return { selected: false, digitMatch: false, inBand: false };
  }
  const sr = Math.floor(selectedIndex / 9);
  const sc = selectedIndex % 9;
  const ri = Math.floor(index / 9);
  const ci = index % 9;
  const selected = index === selectedIndex;
  const inBand =
    ri === sr ||
    ci === sc ||
    (Math.floor(ri / 3) === Math.floor(sr / 3) &&
      Math.floor(ci / 3) === Math.floor(sc / 3));
  const sv = grid[selectedIndex];
  const digitMatch = sv >= 1 && sv <= 9 && grid[index] === sv && !selected;
  const inBandOnly = inBand && !selected;
  return {
    selected,
    digitMatch,
    inBand: inBandOnly,
  };
}

function memoMaskHas(mask: number, digit: number): boolean {
  if (digit < 1 || digit > 9) return false;
  return (mask & (1 << (digit - 1))) !== 0;
}

function CellMemoMarks({
  mask,
  highlightDigit,
}: {
  mask: number;
  highlightDigit: number | null;
}) {
  return (
    <span className="pointer-events-none flex h-full min-h-0 w-full items-center justify-center px-0.5 py-0.5">
      <span className="grid aspect-square h-full w-full max-h-full max-w-full grid-cols-3 grid-rows-3 place-items-center text-[0.58rem] leading-none sm:text-[0.68rem]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const visible = memoMaskHas(mask, d);
          const digitHighlight =
            visible && highlightDigit !== null && d === highlightDigit;
          return (
            <span
              key={d}
              className={
                visible
                  ? digitHighlight
                    ? "font-extrabold tabular-nums text-zinc-900"
                    : "font-medium tabular-nums text-zinc-400"
                  : "invisible tabular-nums"
              }
            >
              {d}
            </span>
          );
        })}
      </span>
    </span>
  );
}

function cellSurfaceClasses(
  readOnly: boolean,
  h: CellHighlight,
  incorrect: boolean,
): string {
  if (h.selected) {
    return incorrect
      ? "relative z-10 bg-red-200 ring-2 ring-inset ring-blue-600"
      : "relative z-10 bg-sky-200 ring-2 ring-inset ring-blue-600";
  }
  if (incorrect) {
    return readOnly
      ? "bg-red-100 text-red-900"
      : "bg-red-100 text-red-900 hover:bg-red-200";
  }
  if (h.digitMatch) {
    return readOnly
      ? "bg-sky-200 text-zinc-900"
      : "bg-sky-100 text-zinc-900 hover:bg-sky-200";
  }
  if (h.inBand) {
    return readOnly
      ? "bg-sky-100 text-zinc-900"
      : "bg-sky-50 text-zinc-900 hover:bg-sky-100";
  }
  return readOnly
    ? "bg-zinc-100 text-zinc-900"
    : "bg-white text-zinc-900 hover:bg-zinc-50";
}

type SudokuBoardProps = {
  gridValues: readonly number[];
  fixed: readonly boolean[];
  cellReadOnly: readonly boolean[];
  selectedIndex: number | null;
  setSelectedIndex: (index: number) => void;
  board: SudokuGrid;
  memoHighlightDigit: number | null;
  solution81: string;
};

export function SudokuBoard({
  gridValues,
  fixed,
  cellReadOnly,
  selectedIndex,
  setSelectedIndex,
  board,
  memoHighlightDigit,
  solution81,
}: SudokuBoardProps) {
  return (
    <div className="inline-block rounded-lg border-2 border-zinc-700 bg-white p-0.5 shadow-sm">
      <div className="grid grid-cols-9">
        {gridValues.map((value, i) => {
          const readOnly = cellReadOnly[i];
          const h = cellHighlights(i, selectedIndex, gridValues);
          const incorrect = isCellMismatchingSolution(
            i,
            gridValues,
            solution81,
            fixed,
          );
          const mask = board.cellAt(i).memoMask;
          const showMemo = value === 0 && mask !== 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              aria-current={h.selected ? "true" : undefined}
              className={[
                "flex h-9 w-9 font-medium sm:h-10 sm:w-10",
                showMemo
                  ? "items-stretch p-0"
                  : "items-center justify-center p-0",
                !showMemo && value !== 0
                  ? "text-xl leading-none sm:text-2xl sm:leading-none"
                  : "",
                cellBorderClasses(i),
                cellSurfaceClasses(readOnly, h, incorrect),
              ].join(" ")}
            >
              {showMemo ? (
                <CellMemoMarks
                  mask={mask}
                  highlightDigit={memoHighlightDigit}
                />
              ) : value === 0 ? (
                ""
              ) : (
                value
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
