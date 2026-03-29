# アーキテクチャ

nanpure-app の構成・レイヤー・データの流れ・ディレクトリ方針を定義する。コーディング規約やエージェント向けルールは `AGENTS.md`、DB の DDL は `supabase/migrations/puzzles.sql` を参照する。

## 機能スコープ（最小 MVP）

1. **取得**: `public.puzzles` から問題を **1 件**選び、画面に載せる。
2. **表示**: `puzzle_81` を 9×9 盤面として表示する（`0` は空マス）。
3. **操作**: 空マスに 1〜9 を入力・削除できる。`puzzle_81` で既に数字が与えられているマスは **固定**（編集不可）とする。
4. **正誤**: ユーザーがマスに値を入れた **タイミング**で、そのマスの値を `solution_81` の同じインデックスと比較する。不一致なら **そのマスに紐づく警告**を出す（表示方法は UI 側で決める）。

盤面の現在状態はクライアントの state で持ち、`solution_81` は取得後メモリ上で参照する（MVP）。不正対策を厳密にする必要が出た段階でサーバー検証などを検討する。

## データ取得（ランダム 1 問・RPC なし）

Supabase への問い合わせは **`lib/repositories/`** に閉じ、次の **2 ステップ**とする。

1. `puzzles` から **`id` のみ**取得する（必要に応じてページングや上限を後から足す）。
2. アプリ側で `id` の一覧から **1 つランダムに選び**、選んだ `id` で **通常の `select`** して 1 行（`puzzle_81` / `solution_81` など必要列）を取得する。

DB に `get_random_puzzle` のような RPC は置かない。テーブルが大きくなったら、取得戦略（id のサンプリング方法など）だけリポジトリ側で差し替えやすくする。

ランダム取得の具体例は `lib/repositories/puzzles.ts`（ファイル名は実装時に分割してもよい）にまとめる（id 一覧取得 → 抽選 → `select` 1 行）。

## レイヤーと依存の向き

外側から内側へ一方向を基本とする。

| レイヤー | 役割 |
|----------|------|
| **Infrastructure** | `lib/supabase/` — クライアント生成（ブラウザ用 / サーバー用など）。URL・anon キーは環境変数。 |
| **データアクセス** | `lib/repositories/` — Supabase への問い合わせ。テーブル名・列・取得手順の詳細はここに閉じる。 |
| **型** | `lib/types/` — DB 行・アプリ用の型定義（例: Puzzle）。 |
| **ドメイン（純粋ロジック）** | `lib/validates/` — React ・ `fetch` を持たない TS。81 文字 ↔ セル、固定マス判定、マス単位の正誤など。将来の生成・解法もここ（またはサブファイル）に追加。 |
| **Presentation** | `app/` のルート、`components/`。操作は `lib/validates/` の純粋関数を呼び、正誤ロジックをコンポーネントに直書きしない。 |

## ディレクトリ構成（たたき台）

Next.js の `app/` はルーティング用として維持し、共有ロジックは **`lib/` 配下を 1 本のツリー**で書く（`lib/` を何度もルートから繰り返さない）。

```text
app/
  play/
    page.tsx              # プレイ画面（またはトップをプレイにしても可）
lib/
  supabase/
    client.ts             # ブラウザ用
    server.ts             # Server Component / Route Handler 用
  repositories/
    puzzles.ts            # Supabase 問い合わせ（fetch / 将来 rpc ラッパ含む）
  types/
    puzzle.ts             # DB 行・アプリ用 Puzzle 型（ファイル分割は任意）
  validates/
    grid.ts               # 81 文字 ↔ セル、固定マス判定
    validate.ts           # マス単位の正誤
components/
  nanpure/
    SudokuBoard.tsx
    SudokuCell.tsx        # 入力・警告表示の責務はここに寄せる
```

`lib/` のトップは概ね **`supabase` / `repositories` / `types` / `validates`** の 4 系統とする。ユースケース用の薄いオーケストレーションが必要なら `lib/` 直下に 1 ファイルを置くか、`repositories` 近辺で拡張する。UI 部品が増えたら `components/ui/` を分ける、など段階的に整理する。

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

- **解答作成・投稿**: 別ルート・別コンポーネント群を足し、保存は `lib/repositories/` 側、検証・盤面変換は `lib/validates/`（と必要なら `lib/types/`）に寄せる。
- **アルゴリズム**（生成・難易度・ヒントなど）: `lib/validates/` 以下にファイルを追加し、UI からは純粋関数 API だけを使う。

## 更新履歴

- 2026-03-29: 初版（`docs/implementation-plan.md` から移行しファイル名を `architecture.md` に統一）
- 2026-03-29: ディレクトリ構成を `lib/` 単一ツリーに整理。のち `lib/` トップを `supabase` / `repositories` / `types` / `validates` の 4 系統に統一
