# アーキテクチャ

nanpure-app の構成・レイヤー・データの流れ・ディレクトリ方針を定義する。コーディング規約やエージェント向けルールは `AGENTS.md`、DB の DDL は `supabase/migrations/puzzles.sql` を参照する。

## 機能スコープ（最小 MVP）

1. **取得**: `public.puzzles` から問題を **1 件**選び、画面に載せる。
2. **表示**: `puzzle_81` を 9×9 盤面として表示する（`0` は空マス）。
3. **操作**: 空マスに 1〜9 を入力・削除できる。`puzzle_81` で既に数字が与えられているマスは **固定**（編集不可）とする。
4. **正誤**: ユーザーがマスに値を入れた **タイミング**で、そのマスの値を `solution_81` の同じインデックスと比較する。不一致なら **そのマスに紐づく警告**を出す（表示方法は UI 側で決める）。

盤面の現在状態はクライアントの state で持ち、`solution_81` は取得後メモリ上で参照する（MVP）。不正対策を厳密にする必要が出た段階でサーバー検証などを検討する。

**ルーティング（プレイ）**: 問題の取得・表示の正規 URL は **`/play/[id]`**（`puzzles.id` の uuid）。共有・ブックマーク・再訪で同じ問題を指す。**`/play`** はランダムに 1 件選んで `/play/[id]` へリダイレクトする入口のみとする。

## データ取得（ランダム 1 問・RPC なし）

Supabase への問い合わせは **`lib/repositories/`** に閉じ、次の **2 ステップ**とする。

1. `puzzles` から **`id` のみ**取得する（必要に応じてページングや上限を後から足す）。
2. アプリ側で `id` の一覧から **1 つランダムに選び**、選んだ `id` で **通常の `select`** して 1 行（`puzzle_81` / `solution_81` など必要列）を取得する。

DB に `get_random_puzzle` のような RPC は置かない。テーブルが大きくなったら、取得戦略（id のサンプリング方法など）だけリポジトリ側で差し替えやすくする。

ランダム取得は `lib/repositories/get_random_puzzle.ts` の `get_random_puzzle` にまとめる（id 一覧取得 → 抽選 → `select` 1 行）。**特定 ID の 1 行**は `lib/repositories/get_puzzle_by_id.ts` の `get_puzzle_by_id`。

## リポジトリとサービス（ユースケース）の分担

**Repository（`lib/repositories/`）** の責務は **データベース（Supabase）とのデータのやり取り**に限定する。クエリの組み立てと取得した行の返却。**PostgREST / 通信エラーは Result にまとめず、そのまま `throw`** する（型・内容を UX 向けに丸めない）。**行が無い**などクエリ結果として空のときは `null` などで返す。**リトライ文言・画面状態**といった **UX の判断は書かない**。

その一つ外側に **ユースケース層**（オーケストレーション）を置く。ここは **機能・画面単位**で、repository を **try-catch** し、例外を **UI が分岐しやすい outcome**（成功 / データなし / 再試行を促す 等）に変換する。**Success / Failure のまとめ方はここだけ**。

**置き場所は `lib/services/` に統一する。** `app/<route>/controller.ts` のようにルート隣接でユースケースを置く案は、同一責務が複数パスに散らばり **混乱や重複の温床**になりやすいため採用しない。画面専用のユースケースでも **`lib/services/` に 1 ファイル**（例: `load_random_puzzle_for_play.ts`）とし、`app/.../page.tsx` はそれを呼ぶだけにする。

- **try-catch**: 主にユースケース層で、repository から **throw されたエラー**を捕捉し、UI 向け outcome に変換する。

Next.js の Route Handler / Server Action は HTTP やフォームの入口として使う場合のみ。画面のデータ組み立ての本体は **`lib/services/` の関数**に寄せる。

**UI（`app/` / `components/`）** はユースケースの戻り値に応じて描画する。データ取得・UX 向け分岐は **`lib/services/` 経由**に統一する。

## レイヤーと依存の向き

外側から内側へ一方向を基本とする。

| レイヤー | 役割 |
|----------|------|
| **Infrastructure** | `lib/supabase/` — クライアント生成（ブラウザ用 / サーバー用など）。URL・anon キーは環境変数。 |
| **データアクセス** | `lib/repositories/` — Supabase との入出力のみ。エラーは `throw`、空結果は `null` 等。UX に関する判断は書かない。 |
| **型** | `lib/types/` — DB 行・アプリ用の型定義（例: Puzzle）。 |
| **ドメイン（純粋ロジック）** | `lib/validates/` — React ・ `fetch` を持たない TS。81 文字 ↔ セル、固定マス判定、マス単位の正誤など。 |
| **ユースケース** | `lib/services/` のみ — repository を呼び、throw を含めて **outcome（成功 / 失敗 / 空）** に変換。try-catch は主にここ。 |
| **Presentation** | `app/` のルート、`components/`。操作は `lib/validates/` の純粋関数を呼び、データ取得は **`lib/services/` 経由**に統一。正誤ロジックをコンポーネントに直書きしない。 |

## ディレクトリ構成（たたき台）

Next.js の `app/` はルーティング用として維持し、共有ロジックは **`lib/` 配下を 1 本のツリー**で書く（`lib/` を何度もルートから繰り返さない）。

```text
app/
  play/
    page.tsx              # ランダム → /play/[id] へリダイレクト
    [id]/
      page.tsx            # 指定 id の問題を表示・プレイ（ユースケースは lib/services から import）
lib/
  supabase/
    client.ts             # ブラウザ用
    server.ts             # Server Component / Route Handler 用
  repositories/
    get_random_puzzle.ts  # ランダム 1 問
    get_puzzle_by_id.ts   # id で 1 行
  services/
    load_random_puzzle_for_play.ts  # /play 入口（リダイレクト前）
    load_puzzle_for_play.ts         # /play/[id]（指定 id）
  types/
    puzzle.ts             # DB 行・アプリ用 Puzzle 型（ファイル分割は任意）
  utils/
    grid.ts               # 盤面 81 文字の表示用分割など（純粋関数・UI/validates から利用）
    uuid.ts               # `isUuid` など、ルート param / 入力の共通検証
  validates/
    grid.ts               # `parsePuzzle81` など盤面のパース
    validate.ts           # マス正誤・全マス埋まり・正解一致
components/
  nanpure/
    SudokuBoard.tsx
    SudokuCell.tsx        # 入力・警告表示の責務はここに寄せる
```

`lib/` のトップは概ね **`supabase` / `repositories` / `services` / `types` / `utils` / `validates`** とする。**`lib/utils/`** には、盤面表示用（`grid.ts`）に限らず **複数モジュールから使う純粋ヘルパ**（例: `uuid.ts` の `isUuid`）を置く。ナンプレのルール検証は **`lib/validates/`** と役割を分ける。UI 部品が増えたら `components/ui/` を分ける、など段階的に整理する。

## データモデル（参照）

- `puzzles.id`: `uuid`
- `puzzle_81`: 81 文字、`0`〜`9`（`0` = 空）
- `solution_81`: 81 文字、`1`〜`9`
- `difficulty_id` → `difficulties`（MVP では表示に使うか任意）

RLS・ポリシーは既存マイグレーションのとおり。スキーマ変更は **必ず** `supabase/migrations/` に SQL として残す。

## 開発の進め方

- **縦スライス優先**: ランダム取得 → 表示 → 入力 → マス単位警告まで一気通しで動かしてから仕上げる。
- **変更後**: `npm run lint` と `npm run build` を通す（`AGENTS.md`）。
- **テスト**: `lib/validates/`（`grid` / `validate`）からユニットテストを書きやすい形にする。

## 将来の拡張（方針のみ）

- **解答作成・投稿**: 別ルート・別コンポーネント群を足し、保存の DB 呼び出しは `lib/repositories/`、フロー組み立て・UX 向け結果は `lib/services/`、検証・盤面変換は `lib/validates/`（と必要なら `lib/types/`）に寄せる。
- **アルゴリズム**（生成・難易度・ヒントなど）: `lib/validates/` 以下にファイルを追加し、UI からは純粋関数 API だけを使う。

## 更新履歴

- 2026-03-29: 初版（`docs/implementation-plan.md` から移行しファイル名を `architecture.md` に統一）
- 2026-03-29: ディレクトリ構成を `lib/` 単一ツリーに整理。のち `lib/` トップを `supabase` / `repositories` / `types` / `validates` の 4 系統に統一
- 2026-03-29: 当初リポジトリを Result 型にしたが、**エラーは repository で `throw`、outcome への丸めは service のみ**に変更
- 2026-03-29: リポジトリと UX の責務分離を明文化。`lib/services/` を追加し、ユースケース層で try-catch・再試行向けの戻り値に変換する方針とした
- 2026-03-29: ユースケースは **`lib/services/` のみ**に統一。`app/.../controller.ts` は採用しない（重複・混乱を避ける）
- 2026-03-29: 盤面 81 文字の行分割など共有ヘルパを `lib/utils/grid.ts` に配置（当初 `utils/` をルートに置いたが `lib/utils/` に統一）。`lib/validates/grid.ts` は検証本体の置き場とし役割を分離
- 2026-03-29: プレイは `/play/[id]` を正とし、`get_puzzle_by_id` / `load_puzzle_for_play` を追加。`/play` はランダム選定後リダイレクトのみ
