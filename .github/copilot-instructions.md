# プロジェクト概要

デザイナー・コーダー向けの社内HTMLコンポーネントカタログサイト。
ビルド不要・依存ゼロの Vanilla JS / CSS で動作する。

## 技術スタック

- **言語**: Vanilla JS / CSS（ビルドツール・npmパッケージ一切なし）
- **データ**: `data/components.json`（唯一のデータソース）
- **起動**: VS Code Live Server または Python http.server

## ファイル構成

```
component-catalog/
├── index.html              # カタログ一覧（プレビュー・検索・フィルタ）
├── admin.html              # 管理画面（登録・編集・カテゴリ管理）
├── data/
│   ├── components.json     # コンポーネントデータ（サーバー / GitHub Pages用）
│   └── components-data.js  # 同上のインラインJS版（file://プロトコル専用）
├── assets/
│   ├── css/
│   │   ├── variables.css   # CSS変数（デザイントークン）
│   │   ├── style.css       # カタログページスタイル
│   │   └── admin.css       # 管理画面スタイル
│   └── js/
│       ├── utils.js        # 共通ユーティリティ（buildSrcdoc, copyToClipboard等）
│       ├── catalog.js      # カタログページのロジック
│       └── admin.js        # 管理画面のロジック
├── SPEC.md                 # 詳細仕様書（デザイン定義・スキーマ）
└── CLAUDE.md               # AI開発支援用の行動ルール
```

## 重要なルール

- **コメントは日本語**で記載する
- **`data/components.json` を編集したら `data/components-data.js` も同期**する
  （Live Server使用時は `components.json` のみ更新で即反映、`file://` の場合は両方必要）
- `SPEC.md` に詳細仕様・デザイントークン・スキーマが定義されている。実装時は必ず参照すること
- 外部ライブラリ・npm依存を追加しない（highlight.js のみ CDN で許可済み）

## データスキーマ（components.json）

```json
{
  "categories": ["ボタン", "カード", ...],
  "components": [
    {
      "id": "btn-001",
      "name": "コンポーネント名",
      "category": "ボタン",
      "tags": ["button", "primary"],
      "description": "説明文",
      "html": "<button>...</button>",
      "css": ".btn { ... }",
      "author": "デザインチーム",
      "createdAt": "YYYY-MM-DD",
      "updatedAt": "YYYY-MM-DD"
    }
  ]
}
```

## プロトコル別の動作

| 環境 | データ取得元 | 備考 |
|---|---|---|
| Live Server (HTTP) | `data/components.json` を fetch | JSON更新→リロードで即反映 |
| `file://` 直接開き | `data/components-data.js` | fetch不可のためインライン埋め込みを使用 |

## 主要な関数・機能

- `buildSrcdoc(html, css, scrollable)` — iframe用HTMLを生成。レイアウト系タグは全幅表示、その他は中央寄せ
- `fetchComponents()` / `loadData()` — プロトコルに応じてデータ取得
- `openPreviewModal(comp)` — 拡大プレビューモーダルを開く
- `applyViewportWidth(width)` — プレビューのビューポード幅を切り替え（全幅 / 1440px / 768px / 375px）
- `addCategory()` / `deleteCategory()` — カテゴリの追加・削除（使用中カテゴリは削除不可）
