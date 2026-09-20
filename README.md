# nanpure-app

ナンプレ（数独）の解法テクニックを学び、盤上で試すための Web アプリ。問題はブラウザ内で生成・保存し、サーバーは持ちません。Next.js の静的サイトとして GitHub Pages で配信しています。

## ローカルでの動かし方

```bash
npm install
npm run dev
```

`dev` / `build` は `--webpack` を明示しています（問題生成の Worker が Turbopack の既知バグに当たるため。詳細は `docs/architecture.md`）。

`npm run build` で `out/` に静的ファイルを生成します（`next.config.ts` の `output: "export"`）。`output: "export"` は `next start` に対応しないため、本番相当の確認をしたい場合は `out/` を任意の静的ファイルサーバーで配信してください。

## GitHub Pages へのデプロイ

`main` への push または手動実行で `.github/workflows/deploy.yml` が動き、`npm run build` が生成する `out/` を GitHub Pages に公開します。

## TODO

- 問題投稿機能
  - スクショから画像認識して問題を投稿できるようにしたい
  - 解答作成&難易度判定後に投稿する
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
- puzzle_81 の重複を避ける
- ヒント機能

## バグリスト

-
