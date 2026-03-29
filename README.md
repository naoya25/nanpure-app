# nanpure-app

ナンプレ（数独）の問題をデータベースから取得してプレイするための Web アプリ。Next.js で構築しています。

## 開発

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

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
- 問題作成機能
- 問題投稿機能
- 同ユニット内のメモ自動削除機能
- 
