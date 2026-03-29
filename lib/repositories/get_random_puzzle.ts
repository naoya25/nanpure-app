import type { SupabaseClient } from "@supabase/supabase-js";

import type { PuzzleRow } from "@/lib/types/puzzle";

/** 一覧取得または 1 行取得で Supabase がエラーを返したとき（UI でリトライ表示に使う） */
export type GetRandomPuzzleFailure = {
  ok: false;
  error: {
    step: "list_ids" | "fetch_row";
    message: string;
    code?: string;
  };
};

export type GetRandomPuzzleSuccess = {
  ok: true;
  /** テーブルに行がない、または取得中に行が消えた場合は `null`（通信エラーではない） */
  puzzle: PuzzleRow | null;
};

export type GetRandomPuzzleResult =
  | GetRandomPuzzleSuccess
  | GetRandomPuzzleFailure;

/**
 * `puzzles` から id のみ一覧取得 → 1 件ランダム選択 → その id で 1 行取得（RPC なし）。
 * Supabase エラーは **throw せず** `{ ok: false, error }` で返す（呼び出し側でリトライ UI などに繋げる）。
 */
export async function get_random_puzzle(
  supabase: SupabaseClient,
): Promise<GetRandomPuzzleResult> {
  const { data: idRows, error: idsError } = await supabase
    .from("puzzles")
    .select("id");

  if (idsError) {
    return {
      ok: false,
      error: {
        step: "list_ids",
        message: idsError.message,
        code: idsError.code,
      },
    };
  }

  if (!idRows?.length) {
    return { ok: true, puzzle: null };
  }

  const picked = idRows[Math.floor(Math.random() * idRows.length)];
  if (!picked?.id) {
    return { ok: true, puzzle: null };
  }

  const { data: row, error: rowError } = await supabase
    .from("puzzles")
    .select("*")
    .eq("id", picked.id)
    .maybeSingle();

  if (rowError) {
    return {
      ok: false,
      error: {
        step: "fetch_row",
        message: rowError.message,
        code: rowError.code,
      },
    };
  }

  if (!row) {
    return { ok: true, puzzle: null };
  }

  return { ok: true, puzzle: row as PuzzleRow };
}
