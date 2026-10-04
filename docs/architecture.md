# アーキテクチャ

nanpure-app の構成・レイヤー・データの流れ・ディレクトリ方針を定義する。コーディング規約やエージェント向けルールは `AGENTS.md`、問題データの型は `lib/types/puzzle.ts` を参照する。

## 機能スコープ（最小 MVP）

1. **取得**: URL の `?p=` に問題があればそれを使う。無ければローカル在庫から **1 件**、在庫も無ければその場で生成し、画面に載せる（詳細は次節）。
2. **表示**: `puzzle_81` を 9×9 盤面として表示する（`0` は空マス）。
3. **操作**: 空マスに 1〜9 を入力・削除できる。`puzzle_81` で既に数字が与えられているマスは **固定**（編集不可）とする。
4. **正誤**: ユーザーがマスに値を入れた **タイミング**で、そのマスの値を `solution_81` の同じインデックスと比較する。不一致なら **そのマスに紐づく警告**を出す（表示方法は UI 側で決める）。
5. **入力前の確認**: 押し間違い対策として、**解答と違う数字を入れようとしたときだけ**確認を出す。やめればミス数は増えない（確認を出す判定は `lib/models/play_session.ts`、UI は `components/nanpure/`）。正誤そのものは入力時点でどのみち盤に出るため、この確認で新たに漏れる情報は無い。

盤面の現在状態はクライアントの state で持ち、`solution_81` は取得後メモリ上で参照する（MVP）。アプリはサーバーを持たない完全な静的サイト（`output: "export"`）のため、不正対策を厳密にする必要が出た場合はクライアント側の強化かバックエンド再導入を検討する。

**ルーティング（プレイ）**: プレイ画面は **`/play/`** の 1 本のみ（Client Component）。共有・ブックマーク・再訪で同じ問題を指すのは URL クエリ **`?p=<puzzle_81>`**（81 文字）で、問題が決まった時点で `history.replaceState` により付け直す（詳細は次節）。動的ルート `/play/[id]` は採用しない — id は端末内の localStorage にしか存在せず、静的エクスポートの `generateStaticParams()` では列挙できないため。

## 問題の用意（生成と在庫）

Supabase はもう無い。問題はすべてブラウザ側で完結して用意する。

1. `/play/` を開く。
2. URL に `?p=<81文字>` があれば、その盤面を使う。`sudokuSolutionCountKind`（`lib/algorithms/sudoku_solver.ts`）で解を復元し、一意解でなければ不正な共有 URL として扱う。
3. 無ければ `lib/storage/puzzle_stock.ts` の在庫から 1 件取り出す（`takeOne()`）。
4. 在庫も空なら Worker で生成する（`lib/workers/generate_puzzle_client.ts` の `requestGeneratedPuzzle()`）。Worker の生成に失敗した場合はメインスレッドで同期実行にフォールバックする。
5. 問題が決まったら `history.replaceState` で `?p=<puzzle_81>` を URL に付ける。これが共有 URL になる。
6. 在庫が目標数（3 件）未満なら、上記と同じ Worker 生成で裏から補充する。

この一連の流れは **`lib/services/prepare_puzzle_for_play.ts`**（`preparePuzzleForPlay()`）1 本にまとめる。戻り値は outcome（`ok` / `invalid_shared_puzzle` / `generation_failed`）で、UI（`app/play/page.tsx`）はそれを見て分岐するだけ。

**生成本体**は `lib/workers/generate_puzzle_core.ts` の `generatePuzzleSync()`。Worker（`generate_puzzle.worker.ts`）とメインスレッドのフォールバックの両方がこの同じ純粋関数を呼ぶ。**`generate_puzzle.worker.ts` 自身から `new Worker` を呼ばないこと** — 自己参照でモジュールグラフが循環し、Turbopack のビルドが停止する。`package.json` の `dev` / `build` が `--webpack` を明示しているのも同じ理由（Turbopack は `new Worker(new URL('./x.worker.ts', import.meta.url))` の worker を `.ts` ソースのまま `_next/static/media/` にコピーする既知のバグがあり、ブラウザでの Worker 生成が失敗してフォールバックに落ちる。vercel/next.js Issue #98841 / Discussion #59729）。

**実測**（M2 Mac / Node v22）:

- 生成 + レベル算出（`generatePuzzleSync()`）: 中央値 351ms / p95 1686ms / 最大 4483ms（N=100、仮置き追加後。別の計測を並行実行中に測った）。仮置き追加前は中央値 約 300ms / 最大 2283ms（N=20）
- 共有 URL からの解の復元（`sudokuSolutionCountKind()`）: 中央値 7.7ms / 最大 51.2ms（N=15）。Worker を使わずメインスレッドで同期実行している。
- ヒント一覧（`findApplicableTechniqueSteps()`、全テクニックを 1 回ずつ試す）: 中央値 32.8ms / p95 176ms / 最大 254ms（難易度 100% の 15 問を全テクニックで解いた途中の 551 盤面）。ボタンを押したときだけ走るため、Worker を使わずメインスレッドで同期実行している。重いのは ALS-XZ（最大 75ms）と fish55〜77。
- 生成されるレベルの分布: min 50 / 中央値 54 / 最大 100（N=100、仮置き追加後。追加前は最大 142 で、100 超は未解決の問題）。`SOLVED_DIFFICULTY_SCORE_MIN = 50` により解けた問題のレベルは 50 を下回らない。

**難易度（％）**: `level` とは別軸で、生成器が一意解を保ったまま空けられる穴の数を 100% とし、`lib/types/puzzle.ts` の `DIFFICULTY_PERCENTS`（`100` / `90` / `70` / `50`）で穴の一部だけ残す（残りは `solution_81` の数字で埋め戻す）。クルーを足すだけなので一意解は保たれる。埋め戻しは `lib/algorithms/generate_sudoku.ts` の `refillHolesToRatio()`（`reduceSudokuPuzzleByUniqueness()` の後段）。`generateSudokuPuzzlePair()` / `generatePuzzleSync()` / `requestGeneratedPuzzle()` はいずれも `difficultyPercent`（省略時 `DEFAULT_DIFFICULTY_PERCENT = 100`）を受け取る。共有 URL 経由の問題は穴の数がすでに決まっているため難易度％の対象外（`DEFAULT_DIFFICULTY_PERCENT` 扱い）。UI からの選択は次のタスク。

## ストレージ・ワーカーとサービス（ユースケース）の分担

**`lib/storage/`** の責務は **localStorage とのやり取り**に限定する。`local_storage.ts` がアクセス自体の失敗（環境によっては `window.localStorage` へのアクセスが `throw` する）を握りつぶし、呼び出し側には `null` / 書き込み成否の `boolean` を返す。**throw しない**。上位の `puzzle_stock.ts` / `play_progress.ts` もこれに合わせ、壊れた保存データは検証して空扱いにする。

**`lib/workers/`** の責務は **問題生成**に限定する。`generate_puzzle_client.ts` の `requestGeneratedPuzzle()` は Worker 生成・実行を試み、Worker を作れない・失敗した場合はメインスレッドで同じ処理に **フォールバック** する。両方失敗した場合のみ Promise を reject する。

その外側に **ユースケース層**（オーケストレーション）を置く。問題の用意（`preparePuzzleForPlay()`）は `lib/storage/` の戻り値と `lib/workers/` の reject を見て、**UI が分岐しやすい outcome**（`ok` / `invalid_shared_puzzle` / `generation_failed`）に変換する。**Success / Failure のまとめ方はここだけ**。在庫の裏補充と、解きかけ進行の保存・復元（保存データ → プレイ履歴への変換を含む）もこの層に置き、UI は `lib/storage/` / `lib/workers/` を直接 import しない。この向きは `eslint.config.mjs` の `no-restricted-imports` で強制している。

**置き場所は `lib/services/` に統一する。** `app/<route>/controller.ts` のようにルート隣接でユースケースを置く案は、同一責務が複数パスに散らばり **混乱や重複の温床**になりやすいため採用しない。画面専用のユースケースも **`lib/services/` に 1 モジュール**とし、`app/.../page.tsx` はそれを呼ぶだけにする。

- **try-catch**: 主にユースケース層で、`lib/workers/` から **reject されたエラー**を捕捉し、UI 向け outcome に変換する。

**UI（`app/` / `components/`）** はユースケースの戻り値に応じて描画する。データの用意・UX 向け分岐は **`lib/services/` 経由**に統一する。

## レイヤーと依存の向き

外側から内側へ一方向を基本とする。

| レイヤー | 役割 |
|----------|------|
| **ローカル永続化** | `lib/storage/` — localStorage の読み書き（在庫・解きかけ進行）。アクセス自体が失敗しうるため `throw` せず `null` / `boolean` で返す。 |
| **生成** | `lib/workers/` — Web Worker で問題を生成し、失敗時はメインスレッドの同期処理にフォールバックする。 |
| **型** | `lib/types/` — アプリ用の **型定義**（`Puzzle` など）。振る舞いのないデータ形だけ。 |
| **ドメインモデル** | `lib/models/` — 画面や操作で扱いやすい **オブジェクトの集約**。素の文字列や配列とは別表現でよい。**論理解法テクニックを 1 手ずつ適用する窓口**（`SudokuGrid` を受け、難易度順のオーケストレーションや、ヒント用に今の盤面で使えるテクニックとその 1 手を列挙する `findApplicableTechniqueSteps` など）もここに置く。中身の各テクニック判定は `lib/algorithms/techniques/` の純粋関数を呼ぶ。 |
| **ドメイン（純粋ロジック）** | `lib/validates/` — React ・ `fetch` を持たない TS。81 文字 ↔ セル、固定マス判定、マス単位の正誤など。 |
| **アルゴリズム** | `lib/algorithms/` — **81 文字列の盤**の求解・列挙・検証に加え、**各解法テクニックの 1 手分ロジック**（`techniques/` 以下）を置く。テクニック関数は **`lib/models/` の `SudokuGrid` を受け取り**、次の盤（`SudokuGrid`）と変更マスを返す。このため `lib/algorithms/techniques/` → `lib/models/`（盤の型）と `lib/models/` → `lib/algorithms/techniques/`（適用順の窓口）は相互に依存する。許しているのはこの 1 組だけで、`techniques/` 以外の `lib/algorithms/` は `lib/models/` を import しない。UI からテクニックを直接呼ばない。 |
| **ユースケース** | `lib/services/` のみ — `lib/storage/` と `lib/workers/` を呼び、**outcome（`ok` / `invalid_shared_puzzle` / `generation_failed`）** に変換。try-catch は主にここ。 |
| **Presentation** | `app/` のルート、`components/`。操作は `lib/validates/` の純粋関数を呼び、データ取得は **`lib/services/` 経由**に統一。正誤ロジックをコンポーネントに直書きしない。 |

## ディレクトリ構成（役割のみ）

**ファイル名はここに書かない。** 実体はリポジトリを見る。以下は **ディレクトリごとの意味**だけを固定し、中にどのモジュールを増やすかは都度決める。

Next.js の `app/` は **ルーティングとページの入口**。データの組み立て・再試行の判断は **`lib/services/`** に寄せ、ページは薄く保つ。

共有ロジックは **`lib/` 配下を 1 本のツリー**で書く（`lib/` をルート直下に何度も繰り返さない）。

| パス | 役割 |
|------|------|
| `app/` | App Router。URL に対応する `page` / `layout` など。データの用意は `lib/services` を呼び出す（`output: "export"` の静的サイトのため実行時サーバーは無い）。 |
| `scripts/` | **CLI・実験用スクリプト**。DB は無い。アプリのビルド対象外だが、`lib/algorithms/` や `lib/validates/` を import してよい（盤面の整形、生成統計の収集など）。 |
| `lib/storage/` | **localStorage の読み書きだけ**。在庫（`puzzle_stock`）・解きかけ進行（`play_progress`）。アクセス自体の失敗を握りつぶし `null` / `boolean` で返す。UX や outcome の解釈は書かない。 |
| `lib/workers/` | **問題生成**。Web Worker 本体とメインスレッド用の窓口、両者が共有する同期生成処理を置く。 |
| `lib/services/` | **ユースケース**。`lib/storage/` と `lib/workers/` を組み合わせ、例外や失敗を捕捉して UI が扱いやすい結果に変換する。UI が `lib/storage/` / `lib/workers/` に触れる唯一の経路（問題の用意、在庫の裏補充、解きかけ進行の保存・復元）。 |
| `lib/types/` | **型定義**（`Puzzle` の形、アプリ内で共有する軽い型）と、型に紐づく **固定の表**（テクニックの表示名・並び順、学習順と考え方の文など）。 |
| `lib/models/` | **振る舞い付きのドメイン集約**（プレイ盤面・プレイ履歴・**論理 1 手テクニックの実行**・**プレイ画面のドメイン状態を扱う reducer**など）。`puzzle_81` / `solution_81` 文字列に対する runner 一括実行の要約など、CLI と共有する表現もここに寄せる。 |
| `lib/utils/` | **横断的な小さな純粋関数**（表示用の細切れ、入力検証のヘルパなど）。ドメインの本丸は `validates` に置く。 |
| `lib/algorithms/` | **求解・列挙・一意解判定**（文字列盤）と、**テクニックごとの 1 手検出・適用指示**（`techniques/`、`SudokuGrid` 入力。交差・サブセット・**基本魚（fishNN）**・**スカイスクレーパー**・最後の手段の**仮置き** など）。**難易度スコア**（解けた問題は Σ（使用回数 × 希少度 −log2(使用率)）を難易度 100% の生成問題の分布の百分位で 1〜100 に直す、**未解決は 100 + 残り空マスで 100〜181**。仮置きまで含めると生成器の問題は全問解けるため、未解決になるのは共有 URL で持ち込まれた超難問だけ）もここに置く。CLI / `lib/workers/` / `lib/models` の窓口から再利用する。 |
| `lib/validates/` | **ナンプレのルール・盤面のパース・正誤判定**など、React / `fetch` に依存しない純粋ロジック。 |
| `components/` | **UI 部品**。機能・画面単位でサブディレクトリを切ってよい。共通デザインだけをまとめるなら `components/ui/` などを別立てしてよい。 |

`lib/` のトップに置くディレクトリは、上表のとおり **`storage` / `workers` / `services` / `types` / `models` / `utils` / `algorithms` / `validates`** を基本とする。必要になったら **同じ粒度の責務なら追加**、迷ったらいったん `services` か `validates` に寄せてから分割してよい。

## データモデル（参照）

DB は無い。問題の形は `lib/types/puzzle.ts` の `Puzzle` 型のみ。

- `puzzle_81`: 81 文字、`0`〜`9`（`0` = 空）
- `solution_81`: 81 文字、`1`〜`9`
- `level`: `number`。型上の範囲は `PUZZLE_LEVEL_MIN`〜`PUZZLE_LEVEL_MAX`（1〜200）。解けた問題は 1〜100（難易度 100% の生成問題の百分位なので、その設定ではほぼ一様に散らばる）、未解決は 100 + 残り空マス。**実測**（難易度 100%・N=100）: min 2 / 中央値 59 / 最大 97。そのうち 33 問はシングル系（フルハウス・シングル・隠れシングル）だけで解け、Level 43 以下に入る。埋め戻し後の盤に対して算出する。
- `difficultyPercent`: `DifficultyPercent`（`100` / `90` / `70` / `50` のリテラルユニオン）。「難易度（％）」節を参照。

**テクニック使用状況の分析**（`lib/models/puzzle_technique_run_analysis.ts` の `summarizeTechniqueAutoRunFromStrings()`）は `level` を算出するためだけの **その場限りの計算**で、結果を永続化しない。DB もそれに紐づく RPC も無い。

**localStorage のスキーマ**（いずれも `lib/storage/`、壊れたデータは検証して空扱いにする）:

- `nanpure:stock:v3`（`puzzle_stock.ts`）: 生成済み・未使用の `Puzzle` 配列。`difficultyPercent` ごとに目標在庫数 3 件（旧 `nanpure:stock:v1` は `difficultyPercent` を持たないため、`v2` は旧計算式の `level` を持つため読まない）。
- `nanpure:progress:v1`（`play_progress.ts`）: 解きかけの盤面。`puzzle_81` をキーに最大 20 件、古い順に切り捨てる。**undo/redo 履歴は保存しない。**
- `nanpure:settings:v1`（`play_settings.ts`）: プレイ画面の設定。自動実行で選択中のテクニック ID（`autoRunTechniqueIds: string[]`）と、選択中の難易度（`difficultyPercent?: number`、任意）。読み書きは `lib/services/difficulty_settings.ts` 経由。

## 開発の進め方

- **縦スライス優先**: 問題の用意 → 表示 → 入力 → マス単位警告まで一気通しで動かしてから仕上げる。
- **変更後**: `npm run lint` と `npm run build` を通す（`AGENTS.md`）。
- **テスト**: `lib/validates/` の純粋関数からユニットテストを書きやすい形にする。

## 将来の拡張（方針のみ）

- **解答作成・投稿**: 別ルート・別コンポーネント群を足す。現状はバックエンドを持たないため保存先は別途検討するが、フロー組み立て・UX 向け結果は `lib/services/`、検証・盤面変換は `lib/validates/`（と必要なら `lib/types/`）に寄せる方針は維持する。
- **ヒント**: 論理 1 手テクニックの実行窓口はすでに `lib/models/`（`lib/algorithms/techniques/` を呼ぶ）にある。UI からテクニックを直接呼ばず、純粋関数 API 経由にする方針は変わらない。

## 更新履歴

- 2026-10-04: マスの呼び方を「2行3列」から **B3**（行 A〜I × 列 1〜9）に変え、盤の左と上に符号を表示した。定義は `docs/sudoku-rule.md` の「マスの符号」。ブロックは左上から 1〜9 の番号で呼ぶ（左上と右下のマスで示す案は解説が長くなるため不採用）。呼び方は `/learn/` の冒頭で説明する。表記は `lib/utils/grid.ts` の `cellLabel` / `rowLabel` / `colLabel` / `blockLabel` だけで決まる。
- 2026-10-04: 自動実行を 1 タップにした。自動実行ボタンは保存済みの選択でそのまま実行し、テクニックの選び直しは隣の設定ボタン（`AutoRunPopover`）に分けた。設定はチェックボックスの縦並びから、押して切り替えるチップ（「基本」と「メモを使うテクニック」の 2 群、プリセット「基本だけにする」「すべて選ぶ」）に変えた。1 手も進まなかったときは「選んだテクニックでは進めません」と出す。
- 2026-10-04: ヒントを「今の盤面でどこに・なぜ使えるか」を教える形にした。各テクニック関数（`lib/algorithms/techniques/`）は 1 手の結果に `explanation`（`TechniqueExplanation`: 根拠マス `basisCellIndex` と、今の盤面のマス名・数字を入れた理由 `reason`）を付けて返す。マス名・ユニット名の表記は `lib/utils/grid.ts`（`cellLabel` など）に一本化。ヒント一覧でテクニックを押すと即適用せず、盤に根拠マス（`--cell-bg-basis`）と変わるマスを示して `components/nanpure/HintExplanationPanel.tsx` に理由と変更内容（`lib/models/technique_step_changes.ts` の `describeTechniqueStepChanges()`）を出し、「この手を進める」で適用する。解説中の盤の編集は止め、キーボードは Escape（閉じる）だけ受け付ける。既知の制限: メモが古い盤面では、候補削除系のテクニックが「古い候補の掃除」だけの手を返すことがあり、そのとき理由と変更マスが食い違う。
- 2026-10-04: テクニック学習ページ `/learn/` を追加（静的ページ）。おすすめの学習順と「ここまで覚えると解ける問題の割合」は `lib/types/technique_learning.ts` の `TECHNIQUE_LEARNING_STEPS`（難易度 100% の 1000 問で、次に覚えると解ける問題がいちばん増える手筋を順に選んだもの。出典 `scripts/experiment-results/2026-10-04-20-50-learning-curve.json`、`scripts/experiment-learning-curve.ts`）。考え方の 1〜2 文は同ファイルの `TECHNIQUE_SUMMARY_BY_ID`。
- 2026-10-04: プレイ画面で矢印キーによるマス移動に対応（未選択なら左上から）。ヒントボタンをアイコンにした。
- 2026-10-04: ツーストリング・カイトで、行ペアと列ペアがマスを共有する形（強いリンク 1 本と同じで凧にならない）を検出から外した。消去自体は正しかったが、ヒント一覧に別物の手がカイトとして出るため。
- 2026-10-04: Level の計算式を変えた。旧式は「使った最難の手筋の固定点」がほぼすべてで、同じ手筋の繰り返しは最大 +8 で頭打ちだったため、難しい手筋を 1 回使う問題と何度も使う問題が同じ Level になっていた。新式は各手筋の希少度 −log2(使用率)（`TECHNIQUE_RARITY_WEIGHT`）を使用回数に掛けて足し、難易度 100% の生成問題 1000 問の素点分布の百分位（`SOLVED_RAW_SCORE_LEVEL_THRESHOLDS`、出典 `scripts/experiment-results/2026-10-04-18-31-level-thresholds.md`、`scripts/experiment-level-thresholds.ts`）で 1〜100 にする。旧 `level` を持つ在庫は使わないよう `nanpure:stock:v2` → `v3` に上げた。2026-04 に一度入れて戻した使用率ベースの重み（`(1−p)×40+1`）はシングルにも重みが付き簡単な手の回数に引っぱられたが、−log2 ではシングルの重みがほぼ 0 になる。既知の歪み: 易しいが出番の少ない手筋（隠れペア 1.4% など）は重く出る。
- 2026-10-04: ヒントを「今の盤面で使えるテクニックの一覧」に変えた。`findApplicableTechniqueSteps()`（`lib/models/sudoku_technique_runner.ts`）が全テクニックを 1 回ずつ試し、使えるものをその 1 手つきで返す。一覧（`components/nanpure/TechniquePopover.tsx`、未使用だった部品を作り直した）でテクニックを押すと、その 1 手を再生 hook で適用する。仮置きは最後の手段なので、ほかに 1 つも無いときだけ一覧に出す。盤に解答と違う数字があるときは従来どおり一覧を出さずにそのマスを示す。適用後に解答と食い違う手（誤ったメモが原因）は一覧から外す。一覧はモーダルで、開いている間のキーボードは Escape（閉じる）だけ受け付ける。
- 2026-10-04: ヒント一覧の並びを、難易度 100% の 1000 問での使用率が高い順（`TECHNIQUE_IMPORTANCE_ORDER`、`lib/types/sudoku_technique_types.ts`）にした。自動実行の選択（`AutoRunPopover`）も同じ並びで表示する（適用順は `ALL_TECHNIQUE_IDS` の易→難のまま）。出典は `scripts/experiment-results/2026-09-23-22-23.md`。テクニックを足したら統計を取り直して並べ直す。
- 2026-09-24: 押し間違い対策として、解答と違う数字を入力しようとしたときだけ確認ダイアログを出す（`components/nanpure/DigitConfirmDialog.tsx`）。判定は `lib/models/play_session.ts` の `isDigitMismatchingSolution()`（`lib/validates/validate.ts` の `isDigitCorrectForSolution()` を使う純粋なセレクタ）。「キャンセル」ならミス数は増えず盤も変わらない。ミス数は確認後だけ増えるため自己申告に近くなる。確認中のキーボードは Escape（キャンセル）だけ受け付ける。
- 2026-09-23: テクニックを足しやすくするため、表示名を `TECHNIQUE_LABEL_BY_ID`（`Record<TechniqueId, string>`、書き忘れは型エラー）、画面の並びを `TECHNIQUE_DISPLAY_ORDER` に分け、runner・レベル算出・統計が使う全 ID を `ALL_TECHNIQUE_IDS`（適用順）に一本化した（`lib/types/sudoku_technique_types.ts`）。画面の並びが全 ID を含むこと・仮置きが適用順の末尾であることは `tests/types/` で固定。`scripts/experiment-technique-stats.ts` に、仮置き直前の盤面を書き出す `--dump-trial-boards` を追加。追加手順は `docs/sudoku-techniques.md` に置いた。
- 2026-09-23: 最後の手段として仮置き（`TRIAL_AND_ERROR`、`lib/algorithms/techniques/trial_and_error.ts`）を追加し、適用順の末尾に置いた。候補を 1 つ仮に置いてシングル・隠れシングルだけで進め、矛盾したらその候補を削除する（1 段だけ）。seed 20260923 の 1000 問では仮置き以外で 62 問が詰まり、仮置きを足すと全問解けた。全 27 ユニットのマス index は `helper.ts` の `SUDOKU_UNITS` に置いた。難易度の固定点は 90（AIC の 84 より上）。
- 2026-09-23: クリア時に `SudokuBoard` の `celebrate` prop（`app/globals.css` の `cell-celebrate` keyframes）で盤を光らせる演出を追加し、結果画面に `PlayHistory.techniqueUsageOnCurrentPath()`（`past` + `presentEntry` 集計、undo で捨てた手は含まない）で集計した使用テクニック一覧を表示する。結果画面 JSX は `components/nanpure/PlayResultPanel.tsx` に切り出した。
- 2026-09-23: 自動実行を 1 手ずつアニメーションで進める再生 hook（`components/nanpure/useTechniquePlayback.ts`）を追加し、`SudokuPlayClient` の自動実行・ヒントから使う。ヒントは `runTechniqueAutoUntilNoChange`（`lib/models/sudoku_technique_runner.ts`）に足した `options.maxSteps` で最初の 1 手だけを取得する。`play_session.ts` の action は増やしていない。
- 2026-09-23: プレイ画面（`SudokuPlayClient`）のドメイン状態（history / mistakes / phase / playback ロック）を React 非依存の reducer（`lib/models/play_session.ts` の `playSessionReducer`）へ移した（純粋リファクタ、挙動は変えない）。UI は `useReducer` でこれを呼び、`selectedIndex` 等の画面専用 state のみ引き続き `useState` で持つ。
- 2026-09-23: プレイ画面「自動実行」のテクニック選択チェックボックスを localStorage（`nanpure:settings:v1`, `lib/storage/play_settings.ts`）に保存し、リロード後も復元する。UI からの読み書きは `lib/services/auto_run_settings.ts` 経由。
- 2026-09-21: レイヤー規則と実装の食い違いを解消。UI が `lib/storage/` / `lib/workers/` を直接 import していた箇所（在庫の裏補充、解きかけ進行の保存・復元）を `lib/services/` に移し、`eslint.config.mjs` の `no-restricted-imports` で向きを強制。テクニック関数は 2026-03-30 の記述（DTO、Grid 非依存）と違い当初から `SudokuGrid` を受け取っているため、実装を正としてレイヤー表・ディレクトリ表を直した（`lib/algorithms/techniques/` ↔ `lib/models/` の相互依存だけを許す）。`AGENTS.md` の Supabase 前提の記述も同時に更新。
- 2026-09-20: Supabase を全廃止。問題の生成・保存はブラウザ内で完結する（`lib/workers/` で生成、`lib/storage/` で localStorage への在庫・進行保存）。プレイの正規 URL を `/play/[id]` から `/play/` + `?p=<puzzle_81>` に変更（`generateStaticParams()` で id を列挙できないため）。`lib/supabase/` `lib/repositories/` `supabase/migrations/` と DB 投入系 CLI（`create-puzzle` 等）を削除し、`lib/types/puzzle.ts` の `PuzzleRow` を `Puzzle`（`puzzle_81` / `solution_81` / `level` のみ）に置き換え。`next.config.ts` を `output: "export"` の静的サイトにし、GitHub Pages へデプロイする（`.github/workflows/deploy.yml`）。
- 2026-04-06: 自動適用テクニック脚注の ID をクリックで `docs/sudoku-techniques.md` に対応した Google 検索を別タブで開く（`lib/utils/technique_web_search.ts`）。
- 2026-04-06: プレイ画面（`SudokuPlayClient`）に `puzzles.level`（数値）を表示。
- 2026-04-06: `create-puzzle` CLI は生成後に runner・`level` 算出・`puzzle_solve_analyses` 記録まで行う。`clampScoreToPuzzleLevel`（`lib/utils/`）と分析 RPC 用の `puzzleSolveAnalysisInsertBodyFromSummary`（`lib/models/`）を共有化。
- 2026-04-06: `puzzles` の `level` 再計算 CLI（`recompute-puzzle-levels`）を追加。anon による `puzzles` UPDATE 用に `puzzles_update_level_policy.sql` を追加。runner 集計は `lib/models/` の共有関数に切り出し。
- 2026-04-06: 難易度スコアは **テクニック別固定点**（易→難の目安）のうち **実際に使った最高難易度を基準** とし、手数・種類数・下位テクニック量・最難手の繰り返しを微加点、`50〜100` にクランプ。**未解決は 100 + 残り空マス**（100〜181）。`puzzles.level` の CHECK を 200 まで拡張（`puzzles_level_range_extend.sql`）。旧・実験使用率ベースのウェイトは廃止。
- 2026-04-06: 論理テクニックの使用記録用に `solving_techniques` / `puzzle_solve_analyses` / `puzzle_solve_technique_usage` を追加（`supabase/migrations/puzzle_solve_records.sql`）。データモデル節を追記。
- 2026-04-06: 上記への一括 insert 用 RPC `insert_puzzle_solve_analysis_with_usage` を追加（`puzzle_solve_analysis_rpc.sql`）。CLI `record-puzzle-solve-analyses` から既存 `puzzles` を走査して記録可能。
- 2026-03-30: **論理 1 手テクニック**は `lib/models/` が窓口（`SudokuGrid`・順序・ヒント）、実装ロジックは **`lib/algorithms/techniques/`**（DTO、Grid 非依存）。レイヤー表・ディレクトリ表を整合。
- 2026-03-31: 問題生成ロジックを `scripts/` 直下から `lib/algorithms/` へ移設し、CLI (`scripts/create-puzzle.ts`) はそれを呼ぶ構成に統一。
- 2026-03-30: プレイ画面の **undo / redo** は `lib/models/` の **`SudokuGrid` スナップショット列**を保持する履歴オブジェクトで扱う（最大件数・責務は実装参照）。問題切り替えはルート側の **`key`** でクライアントをマウントし直す。
- 2026-03-29: **求解モジュール**を `lib/validates/` から **`lib/algorithms/`** へ移動（レイヤー表・ディレクトリ表・将来拡張の記述を整合）
- 2026-03-29: **`scripts/`** をディレクトリ表に追加（CLI・バッチ）。問題生成は `scripts/generate_sudoku.ts`、`npm run create-puzzle` で DB 投入
- 2026-03-29: **自動問題生成**（対角ブロックシード・一意解を保つ穴あけ）と Supabase への insert 経路を方針に追記
- 2026-03-29: `AGENTS.md` に **着手前の本書確認**と **実装変更時の本書更新**を明文化（エージェント・人間の共通ルール）
- 2026-03-29: 「ディレクトリ構成」を **ファイル名なしの役割表**に変更（ドキュメントと実体の不一致による混乱を避ける）
- 2026-03-29: 初版（`docs/implementation-plan.md` から移行しファイル名を `architecture.md` に統一）
- 2026-03-29: ディレクトリ構成を `lib/` 単一ツリーに整理。のち `lib/` トップを `supabase` / `repositories` / `types` / `validates` の 4 系統に統一
- 2026-03-29: 当初リポジトリを Result 型にしたが、**エラーは repository で `throw`、outcome への丸めは service のみ**に変更
- 2026-03-29: リポジトリと UX の責務分離を明文化。`lib/services/` を追加し、ユースケース層で try-catch・再試行向けの戻り値に変換する方針とした
- 2026-03-29: ユースケースは **`lib/services/` のみ**に統一。`app/.../controller.ts` は採用しない（重複・混乱を避ける）
- 2026-03-29: 盤面 81 文字の行分割など共有ヘルパを `lib/utils/grid.ts` に配置（当初 `utils/` をルートに置いたが `lib/utils/` に統一）。`lib/validates/grid.ts` は検証本体の置き場とし役割を分離
- 2026-03-29: プレイは `/play/[id]` を正とし、`get_puzzle_by_id` / `load_puzzle_for_play` を追加。`/play` はランダム選定後リダイレクトのみ
