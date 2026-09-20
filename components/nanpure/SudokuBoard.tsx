import type { CSSProperties } from "react";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { isCellMismatchingSolution } from "@/lib/validates/validate";

export const CELL_SIZE_EXPR =
  "max(30px, calc(min(100vw - 2rem, 34rem, 100vh - 22rem) / 9))";

function cellBorderClasses(index: number): string {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const parts: string[] = [];
  if (col < 8) {
    parts.push(
      col % 3 === 2
        ? "border-r-2 border-r-[var(--rule-thick)]"
        : "border-r border-r-[var(--rule-thin)]",
    );
  }
  if (row < 8) {
    parts.push(
      row % 3 === 2
        ? "border-b-2 border-b-[var(--rule-thick)]"
        : "border-b border-b-[var(--rule-thin)]",
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

const memoFontSize: CSSProperties = {
  fontSize: "calc(var(--cell) * 0.27)",
};

function CellMemoMarks({
  mask,
  highlightDigit,
}: {
  mask: number;
  highlightDigit: number | null;
}) {
  return (
    <span className="pointer-events-none flex h-full min-h-0 w-full items-center justify-center px-0.5 py-0.5">
      <span
        className="grid aspect-square h-full w-full max-h-full max-w-full grid-cols-3 grid-rows-3 place-items-center leading-none"
        style={memoFontSize}
      >
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
                    ? "font-bold tabular-nums text-[var(--memo-strong)]"
                    : "font-normal tabular-nums text-[var(--memo)]"
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

function cellBackgroundClass(
  h: CellHighlight,
  incorrect: boolean,
  techniqueHighlighted: boolean,
): string {
  if (incorrect) return "bg-[var(--cell-bg-error)]";
  if (techniqueHighlighted) return "bg-[var(--cell-bg-technique)]";
  if (h.digitMatch) return "bg-[var(--cell-bg-same)]";
  if (h.inBand) return "bg-[var(--cell-bg-peer)]";
  if (h.selected) return "bg-[var(--cell-bg-selected)]";
  return "bg-[var(--cell-bg)]";
}

function digitTextClass(fixedCell: boolean, incorrect: boolean): string {
  if (incorrect) return "font-bold text-[var(--digit-error)]";
  if (fixedCell) return "font-bold text-[var(--digit-given)]";
  return "font-medium text-[var(--digit-user)]";
}

type SudokuBoardProps = {
  gridValues: readonly number[];
  fixed: readonly boolean[];
  cellReadOnly: readonly boolean[];
  selectedIndex: number | null;
  setSelectedIndex: (index: number) => void;
  board: SudokuGrid;
  memoHighlightDigit: number | null;
  solution81?: string;
  techniqueHighlightedCells: ReadonlySet<number> | null;
  /** true のときセルをクリック・フォーカスできない（振り返り再生など） */
  interactionDisabled?: boolean;
};

export function SudokuBoard({
  gridValues,
  fixed,
  selectedIndex,
  setSelectedIndex,
  board,
  memoHighlightDigit,
  solution81,
  techniqueHighlightedCells,
  interactionDisabled = false,
}: SudokuBoardProps) {
  return (
    <div
      className="inline-block rounded-lg bg-[var(--cell-bg)] shadow-sm outline outline-2 -outline-offset-2 outline-[var(--rule-thick)]"
      style={{ "--cell": CELL_SIZE_EXPR } as CSSProperties}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(9, var(--cell))",
          gridTemplateRows: "repeat(9, var(--cell))",
        }}
      >
        {gridValues.map((value, i) => {
          const h = cellHighlights(i, selectedIndex, gridValues);
          const incorrect =
            solution81 !== undefined
              ? isCellMismatchingSolution(i, gridValues, solution81, fixed)
              : false;
          const mask = board.cellAt(i).memoMask;
          const showMemo = value === 0 && mask !== 0;
          const techniqueHighlighted =
            techniqueHighlightedCells?.has(i) ?? false;
          const cellSizeStyle: CSSProperties = {
            width: "var(--cell)",
            height: "var(--cell)",
          };
          const digitStyle: CSSProperties =
            !showMemo && value !== 0
              ? { fontSize: "calc(var(--cell) * 0.58)" }
              : {};
          const commonClass = [
            "flex leading-none",
            showMemo ? "items-stretch p-0" : "items-center justify-center p-0",
            cellBorderClasses(i),
            cellBackgroundClass(h, incorrect, techniqueHighlighted),
            !showMemo && value !== 0 ? digitTextClass(fixed[i], incorrect) : "",
            h.selected
              ? "relative z-10 ring-2 ring-inset ring-[var(--ring-selected)]"
              : "",
          ].join(" ");
          const children = showMemo ? (
            <CellMemoMarks mask={mask} highlightDigit={memoHighlightDigit} />
          ) : value === 0 ? (
            ""
          ) : (
            value
          );
          if (interactionDisabled) {
            return (
              <div
                key={i}
                className={commonClass}
                style={{ ...cellSizeStyle, ...digitStyle }}
                aria-hidden
              >
                {children}
              </div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              aria-current={h.selected ? "true" : undefined}
              className={commonClass}
              style={{ ...cellSizeStyle, ...digitStyle }}
            >
              {children}
            </button>
          );
        })}
      </div>
    </div>
  );
}
