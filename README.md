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
- ショートカットテクニック
  - 自明なマス
    - 各ユニットごとに空のマスが一つしかない時
    - メモが記入されている時、マス内のメモが一つしかない時
      - メモが正しいかどうかは考慮しない
    - 特定の数字が8箇所分正解のマスに入っている時
  - 候補全書き出し
- 問題のテクニック準拠型難易度判定
- DBでpuzzle_81をユニークにする
- テクニック詳細ページを作成
- 電波なくても遊べるようにしたい
  - でもweb版なので難しいか、、
