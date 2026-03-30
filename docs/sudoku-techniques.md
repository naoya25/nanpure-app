# ナンプレ解法テクニック（一覧）

論理だけで盤面を進めるための手筋を整理する。

## 難易度の目安

| 難易度   | 目安                                                                 |
| -------- | -------------------------------------------------------------------- |
| 初級     | ユニット内の確定系、ロック候補。                                     |
| 初〜中級 | ロック候補のうち、候補グリッド前提の見方。                           |
| 中級     | 裸／隠れサブセット、基本の魚。候補の整理が前提になる。               |
| 中〜上級 | 魚の導入〜単一数字パターン。文献によって前後する。                   |
| 上級     | 翼・フィン付き魚・一意性系など。パターン認識が重い。                 |
| 難問向け | 著色、ALS、交互推論チェイン（AIC）など。手順が長く説明コストが高い。 |
| 探索     | 仮置き・矛盾。                                                       |

## テクニック一覧

**凡例**: **詳細**はこのリポ内の解説ページへのリンク。**—** は未執筆。

| 難易度   | テクニック                                                             | 概要                                                                                                          | 詳細                                                        |
| -------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 初級     | フルハウス                                                             | 行・列・ブロックのどれかで空きマスが 1 つだけ → 未出現の数字を確定。                                          | -                                                           |
| 初級     | シングル                                                               | あるマスの候補が 1 つだけ → その数字を確定。                                                                  | -                                                           |
| 初級     | 隠れシングル（Hidden single）                                          | あるユニット内で、ある数字が置けるマスが 1 つだけ → 確定。                                                    | [hidden-single.md](techniques/hidden-single.md)             |
| 初〜中級 | ポインティング（Pointing / Pointing pair）                             | ブロック内で某数字の候補が 1 行（または 1 列）にだけある → その行（列）のブロック外から当該数字の候補を削除。 | [intersection.md](techniques/intersection.md)               |
| 初〜中級 | ボックス・ライン削減（Box-line reduction / Claiming）                  | 某行（列）で某数字の候補が 1 ブロック内にだけある → そのブロックの当該行（列）以外から削除。                  | [intersection.md](techniques/intersection.md)               |
| 中級     | 裸のペア／トリプル／クァッド（Naked pair/triple/quad）                 | ユニット内の n マスに、合計ちょうど n 種類の候補だけがある → それらの数字をユニット内の他マスから削除。       | [naked-subset.md](techniques/naked-subset.md)               |
| 中級     | 隠れペア／トリプル／クァッド（Hidden pair/triple/quad）                | 某 n 種類の数字の候補が、ユニット内でちょうど n マスにだけ現れる → それらのマスから他数字の候補を削除。       | [hidden-subset.md](techniques/hidden-subset.md)             |
| 中〜上級 | X-Wing                                                                 | 某数字について、2 行×2 列（またはその転置）に候補が拘束 → それ以外から削除。                                  | [fish.md](techniques/fish.md)                               |
| 上級     | Swordfish / Jellyfish                                                  | 3 行×3 列、4 行×4 列への拡張。                                                                                | [fish.md](techniques/fish.md)                               |
| 上級     | フィン付き・殺進魚・変形魚など（Finned / Sashimi / Franken 等）        | 基本魚に例外マスやボックス拘束を加えた拡張。文献・実装で名称が細分化される。                                  | —                                                           |
| 中〜上級 | スカイスクレーパー／ツーストリングカイト（Skyscraper / 2-String Kite） | 強いリンク 4 点に着目した単一数字の削除パターン（ツーロット入り魚などと関連）。                               | —                                                           |
| 上級     | ターボフィッシュ（Turbot Fish）                                        | 単一数字のチェイン様パターンの総称に近い（Skyscraper 等を含む）。                                             | —                                                           |
| 上級     | XY-Wing / XYZ-Wing / WXYZ-Wing                                         | ピボットと翼の候補関係から、候補を削除する基本〜拡張翼。                                                      | —                                                           |
| 上級     | W-Wing など                                                            | 強いリンク 2 本で繋がる二値マス同士の関係を使う翼系。                                                         | —                                                           |
| 上級     | ユニーク長方形（Unique Rectangle）                                     | 一意解を壊す候補配置を避けて削除・確定。タイプが複数ある（一意解を仮定）。                                    | —                                                           |
| 上級     | BUG / BUG+1 など                                                       | 全マス二値で埋まる「deadly pattern」付近の論理（一意解を仮定）。                                              | —                                                           |
| 難問向け | シングル・カラー／マルチカラー／3D Medusa など                         | 強いリンクを色分けし、同色同士の矛盾や「どちらかの色が真」から削除。                                          | —                                                           |
| 難問向け | X-Chain / AIC（交互推論チェイン）                                      | 強い・弱いリンクの交互列からの帰結。現代の「論理解」では中核になりやすい。                                    | —                                                           |
| 難問向け | ALS-XZ / ALS-XY-Wing / Sue de Coq など                                 | ほぼロック集合の共通候補からの削除。                                                                          | —                                                           |
| 初〜中級 | ペンシルマーク（候補の記入）                                           | テクニックというより**作業法**。多くの中級以上の手筋の前提。                                                  | [pencil-marks.md](techniques/pencil-marks.md)               |
| 探索     | 仮置き・矛盾（試し打ち）                                               | 候補を仮に真とし伝播、矛盾なら反対が真。**探索**に近く強力。                                                  | [trial-contradiction.md](techniques/trial-contradiction.md) |

## 参考（外部）

- [HoDoKu – Solving Techniques Introduction](http://hodoku.sourceforge.net/en/tech_intro.php)
- [SudokuWiki – Strategy List](https://www.sudokuwiki.org/Strategy_Expanded_List)（Andrew Stuart）
- [Sudopedia – Category:Solving Techniques](http://www.sudopedia.org/wiki/Category:Solving_Techniques)
