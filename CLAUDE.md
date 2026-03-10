# 社内コンポーネントカタログ

## 行動ルール（必ず守ること）

- ファイルの作成・編集・コマンド実行は自動で進めてよい
- 以下の場合は**必ず事前に確認**を取ること
  - `component-catalog/` フォルダ外へのアクセス・変更
  - ファイル・フォルダの削除（rm, delete など）
  - 既存ファイルの全上書き（内容を完全に置き換える場合）

## プロジェクト概要

デザイナー・コーダー向けの社内HTMLコンポーネントカタログサイト。

## 技術スタック

- Vanilla JS / CSS（ビルド不要・依存ゼロ）
- データ管理: `data/components.json`（唯一のデータソース）
- サーバー不要（Live Serverで動作）

## ファイル構成

```
catalog/
├── CLAUDE.md
├── SPEC.md               ← 詳細仕様はこちらを参照
├── data/
│   └── components.json
├── assets/
│   ├── css/
│   │   ├── variables.css
│   │   ├── style.css
│   │   └── admin.css
│   └── js/
│       ├── catalog.js
│       ├── admin.js
│       └── utils.js
├── index.html
├── admin.html
└── README.md
```

## ページ構成

- `index.html`: カタログ一覧（プレビュー・検索・フィルタ）
- `admin.html`: コンポーネント登録・編集・JSONエクスポート

## 実装時の注意

- 詳細仕様・デザイン定義・スキーマは **SPEC.md を必ず参照**すること
- コメントは日本語で記載
- 実装順: variables.css → style.css → index.html → admin.html → README.md
