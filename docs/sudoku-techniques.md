# ナンプレ解法テクニック（一覧）

論理だけで盤面を進めるための手筋を整理する。

## 難易度の目安


| 難易度 | 目安                                         |
| --- | ------------------------------------------ |
| 初級  | メモなしでも自明な手筋。                               |
| 中級  | 候補の整理が前提になる手筋。多くのナンプレをここまでのテクニックで解くことができる。 |
| 上級  | ほとんどのナンプレをここまでのテクニックで解くことができる。             |
| 探索  | ズルに近い。                                     |


## テクニック一覧


| 難易度   | テクニック                                           | 概要                                                                                                  | 詳細                                                                       | 実装状況 |
| ----- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---- |
| 初級    | `FULL_HOUSE`                                    | 行・列・ブロックのどれかで空きマスが 1 つだけ → 未出現の数字を確定。隠れシングルに包含される                                                   | [検索](https://www.google.com/search?q=ナンプレ+フルハウス)                         | done |
| 初級    | `SINGLE`                                        | ピアの確定数字からそのマスの候補を求め、候補が 1 つだけなら確定（メモは候補との交差）。                                                       | [検索](https://www.google.com/search?q=ナンプレ+シングル)                          | done |
| 初級    | `HIDDEN_SINGLE`                                 | あるユニット内で、ある数字が置けるマスが 1 つだけ → 確定。                                                                    | [検索](https://www.google.com/search?q=ナンプレ+隠れシングル)                        | done |
| 初級    | `MEMO_SINGLE`                                   | ピアは見ず、メモ（ペンシルマーク）がちょうど 1 桁だけの空マスをその数字で確定。                                                           | [検索](https://www.google.com/search?q=ナンプレ+メモ1候補の確定)                      | done |
| -     | `SOLUTION_SYNC`                                 | テクニックではない。プレイ支援用の 1 手。確定マスが正解と異なればその数字だけ消す（メモは触れない）。                                                | [検索](https://www.google.com/search?q=ナンプレ+正解同期)                          | done |
| 中級    | `PENCIL_MARK`                                   | テクニックというより作業法。多くの中級以上の手筋の前提。                                                                        | [検索](https://www.google.com/search?q=ナンプレ+ペンシルマーク)                       | done |
| 中級    | `POINTING`                                      | ブロック内で某数字の候補が 1 行（または 1 列）にだけある → その行（列）のブロック外から当該数字の候補を削除。                                         | [検索](https://www.google.com/search?q=ナンプレ+ポインティング)                       | done |
| 中級    | `BOX_LINE_REDUCTION`                            | 某行（列）で某数字の候補が 1 ブロック内にだけある → そのブロックの当該行（列）以外から削除。                                                   | [検索](https://www.google.com/search?q=ナンプレ+ボックス・ライン削減)                    | done |
| 中級    | `PAIR` / `TRIPLE` / `QUAD`                      | ユニット内の N マスで候補の和集合がちょうど N 種類（各マスはその N 種類のみ）→ その数字をユニット内の他マスから削除。                                    | [検索](https://www.google.com/search?q=ナンプレ+ペア)                            | done |
| 中級    | `HIDDEN_PAIR` / `HIDDEN_TRIPLE` / `HIDDEN_QUAD` | 某 N 種類の数字の候補がユニット内でちょうど N マスにだけ現れる → それらのマスから他数字の候補を削除。                                             | [検索](https://www.google.com/search?q=ナンプレ+隠れペア)                          | done |
| 中級〜上級 | `FISH_22`〜`FISH_88`                             | 某数字について N 行×N 列（または転置）に候補が拘束する基本魚 → それ以外から削除。`fish22=X-Wing`、`fish33=Swordfish`、`fish44=Jellyfish`。 | [検索](https://www.google.com/search?q=ナンプレ+fish22)                        | done |
| 中級    | `SKYSCRAPER`                                    | 某数字について、同一の行（または列）上の 2 本の強いリンクが、別の列（行）で「足」側のマスを共有する形 → 屋根から見えるマスで削除（フロア上の共役マスは除外）。                  | [検索](https://www.google.com/search?q=ナンプレ+スカイスクレーパー)                     | done |
| 中級    | `TWO_STRING_KITE`                               | 某数字について、ある行とある列にそれぞれ共役ペアがあり、交わるブロックのマスで繋がる凧形。凧の両端を同時に見るマスから当該数字を削除。                                 | [検索](https://www.google.com/search?q=ナンプレ+ツーストリング・カイト)                   | done |
| 中級    | `X_CHAIN`                                       | 単一数字候補で、強リンク/弱リンクを交互に連鎖し、強リンク始端と終端を同時に見るマスから当該数字を削除。                                                | [検索](https://www.google.com/search?q=ナンプレ+X-Chain)                       | done |
| 上級    | `TURBO_FISH`                                    | 単一数字の **強リンク-弱リンク-強リンク**（S-W-S）連鎖。row/col/block の強リンクを使い、Skyscraper / Two-String Kite を含む一般形で削除。    | [検索](https://www.google.com/search?q=ナンプレ+ターボフィッシュ)                      | done |
| 上級    | `XY_WING`                                       | ピボット `{x,y}` と翼 `{x,z}` / `{y,z}` の構造。2 つの翼を同時に見るマスから `z` を削除。                                      | [検索](https://www.google.com/search?q=ナンプレ+XY-Wing)                       | done |
| 上級    | `XYZ_WING`                                      | ピボット `{x,y,z}` と翼 `{x,z}` / `{y,z}`。ピボットと 2 翼を同時に見るマスから `z` を削除。                                    | [検索](https://www.google.com/search?q=ナンプレ+XYZ-Wing)                      | done |
| 上級    | `WXYZ_WING`                                     | 単一ユニット内 4 マスで候補和集合が 4 種の ALS 形（restricted 候補あり）として扱い、他候補を同時視認マスから削除。                                | [検索](https://www.google.com/search?q=ナンプレ+WXYZ-Wing)                     | done |
| 上級    | `W_WING`                                        | 同じ二値候補 `{x,y}` の 2 マスと、候補 `x` の強リンクで両端を繋ぎ、2 マスを同時に見るセルから `y` を削除。                                   | [検索](https://www.google.com/search?q=ナンプレ+W-Wing)                        | done |
| 上級    | `UNIQUE_RECTANGLE`                              | 一意解を壊す候補配置を避けて削除・確定。現実装は **Type 1**（4隅のうち3セルが同一二値、残り1セルから二値を削除）。                                    | [検索](https://www.google.com/search?q=ナンプレ+ユニーク長方形)                       | done |
| 上級    | `BUG_PLUS_1`                                    | 空マスがほぼ二値で 1 マスだけ三値のとき、行・列・ブロックで 3 回現れる候補を残し、当該マスの他候補を削除（一意解を仮定）。                                    | [検索](https://www.google.com/search?q=ナンプレ+BUG%2B1)                       | done |
| 上級    | `XY_CHAIN`                                      | 二値セルを弱リンク（同候補共有）とセル内強リンクで交互に連鎖し、同じ候補で閉じる両端を同時に見るマスからその候補を削除。                                        | [検索](https://www.google.com/search?q=ナンプレ+XY-Chain)                      | done |
| 上級    | `X_CYCLE`                                       | 単一数字候補の強/弱リンクで閉路（nice loop）を作り、continuous では弱リンク辺の共有ハウスから、discontinuous（弱-弱）では該当ノードから候補を削除。         | [検索](https://www.google.com/search?q=ナンプレ+X-Cycle)                       | done |
| 上級    | `AIC`                                           | 候補ノード（cell,digit）で strong/weak を交互連鎖する一般形。現実装は同一 digit 端点の共通ピア削除（X-Chain 包含）まで対応。                   | [検索](https://www.google.com/search?q=ナンプレ+AIC)                           | done |
| 上級    | （ID未定）フィン付き・殺進魚・変形魚など                           | 基本魚に例外マスやボックス拘束を加えた拡張。文献・実装で名称が細分化される。                                                              | [検索](https://www.google.com/search?q=ナンプレ+フィン付き+殺進魚+変形魚)                 | yet  |
| 上級    | （ID未定）シングル・カラー／マルチカラー／3D Medusa など              | 強いリンクを色分けし、同色同士の矛盾や「どちらかの色が真」から削除。                                                                  | [検索](https://www.google.com/search?q=ナンプレ+シングルカラー+マルチカラー+3D+Medusa)      | yet  |
| 上級    | （ID未定）ALS-XZ / ALS-XY-Wing / Sue de Coq など      | ほぼロック集合の共通候補からの削除。                                                                                  | [検索](https://www.google.com/search?q=ナンプレ+ALS-XZ+ALS-XY-Wing+Sue+de+Coq) | yet  |
| 探索    | （ID未定）仮置き・矛盾（試し打ち）                              | 候補を仮に真とし伝播、矛盾なら反対が真。**探索**に近く強力。                                                                    | [検索](https://www.google.com/search?q=ナンプレ+仮置き+矛盾)                        | yet  |


## 参考（外部）

- [HoDoKu – Solving Techniques Introduction](http://hodoku.sourceforge.net/en/tech_intro.php)
- [Sudopedia – Category:Solving Techniques](http://www.sudopedia.org/wiki/Category:Solving_Techniques)
- [ナンプレ技法一覧](https://www20.big.or.jp/~morm-e/puzzle/techniques/number_place/)

