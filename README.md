# nanpure-app

ナンプレ（数独）の問題をデータベースから取得してプレイするための Web アプリ。Next.js で構築しています。

## 開発

```bash
npm install
npm run dev
```

## 環境変数

`.env.local` に Supabase のクライアント用キーを設定します（リポジトリにコミットしないこと）。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## データベース

スキーマは `supabase/migrations/puzzles.sql` を参照。Supabase プロジェクトにマイグレーションを適用してください。

## 問題を生成して DB に追加（CLI）

`.env.local` を用意したうえで:

```bash
npm run create-puzzle
npm run create-puzzle -- --count=5
```

## TODO

- 問題投稿機能
  - スクショから画像認識して問題を投稿できるようにしたい
  - 解答作成&難易度判定後に投稿する
- タイマー
- ログイン
  - 解答履歴を保存、統計
  - お気に入りの問題の保存、共有
  - ユーザのレベルを測る
- 問題のテクニック準拠型難易度判定
  - 1000問くらい問題を作成
  - 解かせる
  - 使用したテクニックの使用率を計算する
  - テクニックごとのレベルを決める
  - 問題ごとに使用しなければならないテクニックのレベルから難易度を決める
- テクニック詳細ページを作成
  - 振り返りモードでテクニック詳細ページへ紐付け(別タブ遷移)
- DBでpuzzle_81をユニークにする

## バグリスト

-
