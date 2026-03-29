import type { SupabaseClient } from "@supabase/supabase-js";

import { get_random_puzzle } from "@/lib/repositories/get_random_puzzle";
import type { PuzzleRow } from "@/lib/types/puzzle";

/** プレイ画面が分岐しやすい形（リトライ・空状態は UX 層の関心） */
export type LoadRandomPuzzleForPlayResult =
  | { outcome: "ok"; puzzle: PuzzleRow }
  | { outcome: "no_data" }
  | { outcome: "retry"; userMessage: string };

const RETRY_MESSAGE =
  "問題の読み込みに失敗しました。しばらくしてからもう一度お試しください。";

/**
 * プレイ用にランダム 1 問を用意するユースケース。
 * repository はエラー時に throw するため、ここで try-catch して UI 向け outcome に丸める。
 */
export async function loadRandomPuzzleForPlay(
  supabase: SupabaseClient,
): Promise<LoadRandomPuzzleForPlayResult> {
  try {
    const puzzle = await get_random_puzzle(supabase);

    if (puzzle === null) {
      return { outcome: "no_data" };
    }

    return { outcome: "ok", puzzle };
  } catch {
    return { outcome: "retry", userMessage: RETRY_MESSAGE };
  }
}
