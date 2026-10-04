import type { CSSProperties } from "react";

import { SudokuGrid } from "@/lib/models/sudoku_grid";
import { ROW_LETTERS, cellLabel } from "@/lib/utils/grid";
import { isCellMismatchingSolution } from "@/lib/validates/validate";

export const CELL_SIZE_EXPR =
  "max(30px, calc(min(100vw - 2rem, 34rem, 100vh - 22rem) / 9))";

const CELEBRATE_STEP_DELAY_MS = 12;

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
  highlightDigit: number | null,
): CellHighlight {
  if (selectedIndex === null) {
    return {
      selected: false,
      digitMatch: highlightDigit !== null && grid[index] === highlightDigit,
      inBand: false,
    };
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
  const digitMatch =
    highlightDigit !== null && grid[index] === highlightDigit && !selected;
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
  basisHighlighted: boolean,
): string {
  if (incorrect) return "bg-[var(--cell-bg-error)]";
  if (techniqueHighlighted) return "bg-[var(--cell-bg-technique)]";
  if (basisHighlighted) return "bg-[var(--cell-bg-basis)]";
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

function cellAriaLabel(index: number, value: number): string {
  return `${cellLabel(index)} ${value === 0 ? "空き" : value}`;
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
  /** ヒントの解説で、テクニックの根拠になるマス */
  basisHighlightedCells?: ReadonlySet<number> | null;
  /** true のときセルをクリック・フォーカスできない（振り返り再生など） */
  interactionDisabled?: boolean;
  /** true のとき各マスが順に光るクリア演出を再生する */
  celebrate?: boolean;
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
  basisHighlightedCells = null,
  interactionDisabled = false,
  celebrate = false,
}: SudokuBoardProps) {
  return (
    <div
      className="relative mt-4 inline-block rounded-lg bg-[var(--cell-bg)] shadow-sm outline outline-2 -outline-offset-2 outline-[var(--rule-thick)]"
      style={{ "--cell": CELL_SIZE_EXPR } as CSSProperties}
    >
      {/* 解説でマスを指す符号（A〜I 行 × 1〜9 列）。盤の幅を変えないよう外側に重ねる */}
      <div
        className="pointer-events-none absolute -top-4 left-0 grid h-4 select-none text-[10px] leading-4 text-zinc-400"
        style={{ gridTemplateColumns: "repeat(9, var(--cell))" }}
        aria-hidden
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="text-center tabular-nums">
            {n}
          </span>
        ))}
      </div>
      <div
        className="pointer-events-none absolute -left-3.5 top-0 grid w-3.5 select-none text-[10px] text-zinc-400"
        style={{ gridTemplateRows: "repeat(9, var(--cell))" }}
        aria-hidden
      >
        {ROW_LETTERS.split("").map((letter) => (
          <span key={letter} className="flex items-center justify-center">
            {letter}
          </span>
        ))}
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(9, var(--cell))",
          gridTemplateRows: "repeat(9, var(--cell))",
        }}
      >
        {gridValues.map((value, i) => {
          const h = cellHighlights(
            i,
            selectedIndex,
            gridValues,
            memoHighlightDigit,
          );
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
          const celebrateStyle: CSSProperties = celebrate
            ? { animationDelay: `${i * CELEBRATE_STEP_DELAY_MS}ms` }
            : {};
          const commonClass = [
            "flex leading-none",
            showMemo ? "items-stretch p-0" : "items-center justify-center p-0",
            cellBorderClasses(i),
            cellBackgroundClass(
              h,
              incorrect,
              techniqueHighlighted,
              basisHighlightedCells?.has(i) ?? false,
            ),
            !showMemo && value !== 0 ? digitTextClass(fixed[i], incorrect) : "",
            h.selected
              ? "relative z-10 ring-2 ring-inset ring-[var(--ring-selected)]"
              : "",
            celebrate ? "cell-celebrate" : "",
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
                style={{ ...cellSizeStyle, ...digitStyle, ...celebrateStyle }}
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
              aria-label={cellAriaLabel(i, value)}
              aria-current={h.selected ? "true" : undefined}
              className={commonClass}
              style={{ ...cellSizeStyle, ...digitStyle, ...celebrateStyle }}
            >
              {children}
            </button>
          );
        })}
      </div>
    </div>
  );
}
