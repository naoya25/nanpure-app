import { TechniqueId } from "@/lib/types/sudoku_technique_types";

/** テクニックの考え方を 1〜2 文で（学習ページ用。用語は `docs/sudoku-rule.md` に合わせる） */
export const TECHNIQUE_SUMMARY_BY_ID: Record<TechniqueId, string> = {
  [TechniqueId.FULL_HOUSE]:
    "行・列・ブロックのどれかで空きマスが 1 つだけなら、まだ出ていない数字が入ります。",
  [TechniqueId.SINGLE]:
    "あるマスの行・列・ブロックに 8 種類の数字がそろっていたら、残りの 1 つが入ります。",
  [TechniqueId.HIDDEN_SINGLE]:
    "ある行・列・ブロックの中で、ある数字を置けるマスが 1 つだけなら、そこに入ります。",
  [TechniqueId.PENCIL_MARK]:
    "空きマスに、入り得る数字（候補）をすべて書き込みます。ここから先のテクニックの土台です。",
  [TechniqueId.MEMO_SINGLE]:
    "メモの数字が 1 つだけになったマスは、その数字で決まります。",
  [TechniqueId.POINTING]:
    "ブロックの中で、ある数字の候補が 1 行（または 1 列）に並んでいたら、その行（列）のブロックの外からその数字を消せます。",
  [TechniqueId.BOX_LINE_REDUCTION]:
    "ある行（列）で、ある数字の候補が 1 つのブロックの中にしか無ければ、そのブロックのほかのマスからその数字を消せます。",
  [TechniqueId.PAIR]:
    "同じユニットの 2 マスが、同じ 2 つの候補しか持たないとき、その 2 つの数字をユニットのほかのマスから消せます。",
  [TechniqueId.TRIPLE]:
    "同じユニットの 3 マスの候補が合わせて 3 種類だけのとき、その 3 つの数字をユニットのほかのマスから消せます。",
  [TechniqueId.QUAD]:
    "同じユニットの 4 マスの候補が合わせて 4 種類だけのとき、その 4 つの数字をユニットのほかのマスから消せます。",
  [TechniqueId.HIDDEN_PAIR]:
    "ユニットの中で、2 つの数字の候補が同じ 2 マスにしか無いとき、その 2 マスからほかの候補を消せます。",
  [TechniqueId.HIDDEN_TRIPLE]:
    "ユニットの中で、3 つの数字の候補が同じ 3 マスにしか無いとき、その 3 マスからほかの候補を消せます。",
  [TechniqueId.HIDDEN_QUAD]:
    "ユニットの中で、4 つの数字の候補が同じ 4 マスにしか無いとき、その 4 マスからほかの候補を消せます。",
  [TechniqueId.FISH_22]:
    "ある数字の候補が、2 つの行で同じ 2 列にしか無いとき、その 2 列のほかのマスからその数字を消せます（行と列を入れ替えても同じ）。",
  [TechniqueId.FISH_33]:
    "X-Wing の 3 行 × 3 列版です。ある数字の候補が 3 つの行で同じ 3 列に収まるとき、その 3 列のほかのマスから消せます。",
  [TechniqueId.FISH_44]:
    "X-Wing の 4 行 × 4 列版です。",
  [TechniqueId.FISH_55]: "X-Wing の 5 行 × 5 列版です。",
  [TechniqueId.FISH_66]: "X-Wing の 6 行 × 6 列版です。",
  [TechniqueId.FISH_77]: "X-Wing の 7 行 × 7 列版です。",
  [TechniqueId.FISH_88]: "X-Wing の 8 行 × 8 列版です。",
  [TechniqueId.SKYSCRAPER]:
    "ある数字の強いリンクが 2 本あり、片方の端どうしが同じ列（行）に並ぶとき、残りの 2 つの端を同時に見るマスからその数字を消せます。",
  [TechniqueId.TWO_STRING_KITE]:
    "ある数字の強いリンクが行と列に 1 本ずつあり、片方の端どうしが同じブロックにあるとき、残りの 2 つの端を同時に見るマスからその数字を消せます。",
  [TechniqueId.TURBO_FISH]:
    "ある数字の強いリンク 2 本を弱いリンクでつないだ形です。スカイスクレーパーやツーストリング・カイトをまとめた一般形です。",
  [TechniqueId.XY_WING]:
    "候補 2 つのマス 3 個（軸と 2 つの翼）で、軸がどちらの数字でも翼のどちらかが同じ数字になるとき、両方の翼を見るマスからその数字を消せます。",
  [TechniqueId.XYZ_WING]:
    "XY-Wing の軸が候補 3 つになった形です。軸と両方の翼を同時に見るマスから、共通の数字を消せます。",
  [TechniqueId.WXYZ_WING]:
    "4 マスで候補が 4 種類だけの形を使い、そのうち 1 つの数字が入り得る全マスを同時に見るマスから、その数字を消せます。",
  [TechniqueId.W_WING]:
    "同じ 2 候補のマス 2 つが、片方の数字の強いリンクでつながっているとき、その 2 マスを同時に見るマスからもう片方の数字を消せます。",
  [TechniqueId.UNIQUE_RECTANGLE]:
    "解が 1 つだけという前提（一意性仮定）を使います。4 マスの長方形が同じ 2 候補だけになると解が 2 通りになるので、そうならないよう候補を消せます。",
  [TechniqueId.BUG_PLUS_1]:
    "空きマスが 1 つを除いてすべて候補 2 つのとき、一意性仮定から、候補 3 つのマスの数字が決まります。",
  [TechniqueId.XY_CHAIN]:
    "候補 2 つのマスを鎖のようにたどり、両端のどちらかが必ず同じ数字になるとき、両端を同時に見るマスからその数字を消せます。",
  [TechniqueId.X_CHAIN]:
    "ある数字の強いリンクと弱いリンクを交互にたどり、両端のどちらかが必ずその数字になるとき、両端を同時に見るマスからその数字を消せます。",
  [TechniqueId.X_CYCLE]:
    "X-Chain が輪になった形です。輪のつながり方から、輪の外や輪の上の候補を消せます。",
  [TechniqueId.ALS_XZ]:
    "N マスで候補が N+1 種類のかたまり（ALS）を 2 つ使います。2 つが 1 つの数字で縛り合うとき、もう 1 つの共通の数字を、それを同時に見るマスから消せます。",
  [TechniqueId.AIC]:
    "数字をまたいで強いリンクと弱いリンクを交互にたどる、チェーンの一般形です。両端のどちらかが必ず成り立つことを使います。",
  [TechniqueId.TRIAL_AND_ERROR]:
    "候補を 1 つ仮に置いて進め、矛盾が出たらその候補を消します。ほかの手が無いときの最後の手段です。",
};

/** 学習ページの統計を取った問題数（難易度 100%） */
export const TECHNIQUE_LEARNING_PUZZLE_COUNT = 1000;

export type TechniqueLearningStep = {
  id: TechniqueId;
  /** このテクニックを 1 回以上使った問題数 */
  usedPuzzleCount: number;
  /** 先頭からこのテクニックまでを覚えたときに解ける問題数 */
  solvablePuzzleCount: number;
};

/**
 * おすすめの学習順。「次に覚えると解ける問題がいちばん増えるテクニック」を順に選んだもの（同数なら使用率の高い順）。
 * 仮置きは最後の手段なので末尾に固定し、この 1000 問で出番の無かったテクニックはそのあとに適用順で並べる。
 * 出典: `scripts/experiment-results/2026-10-04-20-50-learning-curve.json`（`scripts/experiment-learning-curve.ts`）。テクニックを足したら取り直す。
 */
export const TECHNIQUE_LEARNING_STEPS: readonly TechniqueLearningStep[] = [
  { id: TechniqueId.SINGLE, usedPuzzleCount: 1000, solvablePuzzleCount: 0 },
  { id: TechniqueId.FULL_HOUSE, usedPuzzleCount: 1000, solvablePuzzleCount: 12 },
  { id: TechniqueId.HIDDEN_SINGLE, usedPuzzleCount: 988, solvablePuzzleCount: 429 },
  { id: TechniqueId.PENCIL_MARK, usedPuzzleCount: 571, solvablePuzzleCount: 429 },
  { id: TechniqueId.POINTING, usedPuzzleCount: 520, solvablePuzzleCount: 514 },
  { id: TechniqueId.BOX_LINE_REDUCTION, usedPuzzleCount: 291, solvablePuzzleCount: 543 },
  { id: TechniqueId.PAIR, usedPuzzleCount: 263, solvablePuzzleCount: 580 },
  { id: TechniqueId.SKYSCRAPER, usedPuzzleCount: 147, solvablePuzzleCount: 623 },
  { id: TechniqueId.TRIPLE, usedPuzzleCount: 154, solvablePuzzleCount: 651 },
  { id: TechniqueId.XY_WING, usedPuzzleCount: 160, solvablePuzzleCount: 678 },
  { id: TechniqueId.XY_CHAIN, usedPuzzleCount: 156, solvablePuzzleCount: 698 },
  { id: TechniqueId.QUAD, usedPuzzleCount: 83, solvablePuzzleCount: 715 },
  { id: TechniqueId.TWO_STRING_KITE, usedPuzzleCount: 125, solvablePuzzleCount: 733 },
  { id: TechniqueId.ALS_XZ, usedPuzzleCount: 148, solvablePuzzleCount: 754 },
  { id: TechniqueId.FISH_22, usedPuzzleCount: 66, solvablePuzzleCount: 779 },
  { id: TechniqueId.W_WING, usedPuzzleCount: 67, solvablePuzzleCount: 809 },
  { id: TechniqueId.AIC, usedPuzzleCount: 75, solvablePuzzleCount: 836 },
  { id: TechniqueId.XYZ_WING, usedPuzzleCount: 52, solvablePuzzleCount: 861 },
  { id: TechniqueId.UNIQUE_RECTANGLE, usedPuzzleCount: 38, solvablePuzzleCount: 888 },
  { id: TechniqueId.X_CHAIN, usedPuzzleCount: 34, solvablePuzzleCount: 914 },
  { id: TechniqueId.FISH_33, usedPuzzleCount: 14, solvablePuzzleCount: 927 },
  { id: TechniqueId.TURBO_FISH, usedPuzzleCount: 13, solvablePuzzleCount: 937 },
  { id: TechniqueId.HIDDEN_PAIR, usedPuzzleCount: 13, solvablePuzzleCount: 947 },
  { id: TechniqueId.BUG_PLUS_1, usedPuzzleCount: 10, solvablePuzzleCount: 955 },
  { id: TechniqueId.HIDDEN_TRIPLE, usedPuzzleCount: 2, solvablePuzzleCount: 956 },
  { id: TechniqueId.TRIAL_AND_ERROR, usedPuzzleCount: 44, solvablePuzzleCount: 1000 },
  { id: TechniqueId.MEMO_SINGLE, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.HIDDEN_QUAD, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.WXYZ_WING, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.X_CYCLE, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.FISH_44, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.FISH_55, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.FISH_66, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.FISH_77, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
  { id: TechniqueId.FISH_88, usedPuzzleCount: 0, solvablePuzzleCount: 1000 },
];
