import { TechniqueId } from "@/lib/types/sudoku_technique_types";

/**
 * Web 検索クエリ（`docs/sudoku-techniques.md` 一覧の「詳細」列 Google リンクと対応）。
 */
const TECHNIQUE_WEB_SEARCH_QUERY: Record<TechniqueId, string> = {
  [TechniqueId.FULL_HOUSE]: "ナンプレ フルハウス",
  [TechniqueId.SINGLE]: "ナンプレ シングル",
  [TechniqueId.HIDDEN_SINGLE]: "ナンプレ 隠れシングル",
  [TechniqueId.MEMO_SINGLE]: "ナンプレ メモ1候補の確定",
  [TechniqueId.PENCIL_MARK]: "ナンプレ ペンシルマーク",
  [TechniqueId.POINTING]: "ナンプレ ポインティング",
  [TechniqueId.BOX_LINE_REDUCTION]: "ナンプレ ボックス・ライン削減",
  [TechniqueId.PAIR]: "ナンプレ ペア",
  [TechniqueId.TRIPLE]: "ナンプレ トリプル",
  [TechniqueId.QUAD]: "ナンプレ クァッド",
  [TechniqueId.HIDDEN_PAIR]: "ナンプレ 隠れペア",
  [TechniqueId.HIDDEN_TRIPLE]: "ナンプレ 隠れトリプル",
  [TechniqueId.HIDDEN_QUAD]: "ナンプレ 隠れクァッド",
  [TechniqueId.FISH_22]: "ナンプレ fish22",
  [TechniqueId.FISH_33]: "ナンプレ fish33",
  [TechniqueId.FISH_44]: "ナンプレ fish44",
  [TechniqueId.FISH_55]: "ナンプレ fish55",
  [TechniqueId.FISH_66]: "ナンプレ fish66",
  [TechniqueId.FISH_77]: "ナンプレ fish77",
  [TechniqueId.FISH_88]: "ナンプレ fish88",
  [TechniqueId.SKYSCRAPER]: "ナンプレ スカイスクレーパー",
  [TechniqueId.TWO_STRING_KITE]: "ナンプレ ツーストリング・カイト",
  [TechniqueId.X_CHAIN]: "ナンプレ X-Chain",
  [TechniqueId.TURBO_FISH]: "ナンプレ ターボフィッシュ",
  [TechniqueId.XY_WING]: "ナンプレ XY-Wing",
  [TechniqueId.XYZ_WING]: "ナンプレ XYZ-Wing",
  [TechniqueId.WXYZ_WING]: "ナンプレ WXYZ-Wing",
  [TechniqueId.W_WING]: "ナンプレ W-Wing",
  [TechniqueId.UNIQUE_RECTANGLE]: "ナンプレ ユニーク長方形",
  [TechniqueId.BUG_PLUS_1]: "ナンプレ BUG+1",
  [TechniqueId.XY_CHAIN]: "ナンプレ XY-Chain",
  [TechniqueId.X_CYCLE]: "ナンプレ X-Cycle",
  [TechniqueId.ALS_XZ]: "ナンプレ ALS-XZ",
  [TechniqueId.AIC]: "ナンプレ AIC",
};

/** `sudoku-techniques.md` に沿った Google 検索 URL（新しいタブ用） */
export function techniqueIdWebSearchUrl(techniqueId: TechniqueId): string {
  const q = TECHNIQUE_WEB_SEARCH_QUERY[techniqueId];
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
