import type { SupabaseClient } from "@supabase/supabase-js";

import { get_puzzle_by_id } from "@/lib/repositories/get_puzzle_by_id";
import type { PuzzleRow } from "@/lib/types/puzzle";
import { isUuid } from "@/lib/utils/uuid";

export type LoadPuzzleForPlayResult =
  | { outcome: "ok"; puzzle: PuzzleRow }
  | { outcome: "invalid_id" }
  | { outcome: "not_found" }
  | { outcome: "retry"; userMessage: string };

const RETRY_MESSAGE =
  "問題の読み込みに失敗しました。しばらくしてからもう一度お試しください。";

/**
 * 指定 id の問題をプレイ用に取得するユースケース（`/play/[id]` 向け）。
 * repository の throw を try-catch で UI 向け outcome に変換する。
 */
export async function loadPuzzleForPlay(
  supabase: SupabaseClient,
  id: string,
): Promise<LoadPuzzleForPlayResult> {
  if (!isUuid(id)) {
    return { outcome: "invalid_id" };
  }

  try {
    const puzzle = await get_puzzle_by_id(supabase, id);

    if (puzzle === null) {
      return { outcome: "not_found" };
    }

    return { outcome: "ok", puzzle };
  } catch {
    return { outcome: "retry", userMessage: RETRY_MESSAGE };
  }
}
