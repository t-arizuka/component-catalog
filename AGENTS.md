# 社内コンポーネントカタログ — Codex エージェント向け指示書

## 行動ルール（必ず守ること）

- ファイルの作成・編集・コマンド実行は自動で進めてよい
- 以下の場合は**必ず事前に確認**を取ること
  - `component-catalog/` フォルダ外へのアクセス・変更
  - ファイル・フォルダの削除（rm, delete など）
  - 既存ファイルの全上書き（内容を完全に置き換える場合）
- コメントは**日本語**で記載すること
- 不要なリファクタリング・過剰な抽象化はしない。最小限の変更にとどめること

---

## プロジェクト概要

デザイナー・コーダー向けの社内HTMLコンポーネントカタログサイト。

- **技術**: Vanilla JS / CSS（ビルド不要・依存ゼロ）
- **データ**: `data/components.json`（唯一のデータソース）
- **動作環境**: Live Server または Python http.server（`file://` 非推奨）
- **公開**: GitHub Pages `https://t-arizuka.github.io/component-catalog/`

---

## ファイル構成

```
component-catalog/
├── AGENTS.md              ← このファイル（Codex用指示書）
├── CLAUDE.md              ← Claude用指示書（内容はほぼ同じ）
├── SPEC.md                ← 詳細仕様書（必ず参照すること）
├── index.html             ← カタログ一覧ページ
├── admin.html             ← 管理画面（登録・編集・エクスポート）
├── data/
│   ├── components.json    ← コンポーネントデータ（唯一のデータソース）
│   └── components-data.js ← file:// 対応用インラインデータ（自動生成）
├── assets/
│   ├── css/
│   │   ├── variables.css  ← CSS変数定義
│   │   ├── style.css      ← カタログページスタイル
│   │   └── admin.css      ← 管理画面スタイル
│   └── js/
│       ├── utils.js       ← 共通ユーティリティ（copyToClipboard, showToast 等）
│       ├── catalog.js     ← カタログページ処理（カード描画・検索・モーダル）
│       └── admin.js       ← 管理画面処理（CRUD・エクスポート）
├── figma-plugin/          ← ★未実装（次の開発タスク）
│   ├── manifest.json
│   ├── code.js
│   └── ui.html
└── README.md
```

---

## ページ構成

### index.html（カタログ一覧）

- ヘッダー: サイト名 + リアルタイム検索バー + 管理画面リンク
- サイドバー（左240px）: カテゴリ一覧（件数バッジ付き）+ タグクラウド
- メインエリア: コンポーネントカードのグリッド表示
- コンポーネントカード:
  - iframeプレビュー（srcdoc使用・高さ160px固定）
  - コンポーネント名・説明・タグ
  - 「コードを見る」「HTML」「CSS」「Figma」ボタン
- コードモーダル: HTML/CSSタブ切り替え + highlight.js シンタックスハイライト
- 拡大プレビューモーダル: iframeで全幅/PC/タブレット/モバイル表示切り替え

### admin.html（管理画面）

- コンポーネント一覧テーブル（名前・カテゴリ・登録日・編集・削除）
- 削除済みコンポーネントセクション（復元・完全削除）
- 登録・編集フォーム（右側にリアルタイムプレビュー）
- JSONエクスポート / JSONインポート

---

## データスキーマ（components.json）

```json
{
  "categories": ["ABOUT", "CARD", "CTA"],
  "components": [
    {
      "id": "comp-001",
      "name": "コンポーネント名",
      "category": "ABOUT",
      "tags": ["tag1", "tag2"],
      "description": "説明文",
      "html": "HTMLコード文字列",
      "css": "CSSコード文字列",
      "author": "作成者名",
      "createdAt": "YYYY-MM-DD",
      "updatedAt": "YYYY-MM-DD"
    }
  ],
  "deletedComponents": [
    {
      "...": "通常のフィールドに加えて",
      "deletedAt": "YYYY-MM-DD"
    }
  ]
}
```

---

## CSS変数（variables.css）

```css
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --sidebar-width: 240px;
  --radius: 8px;
  --radius-sm: 6px;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --transition: 0.15s ease;
}
```

---

## 外部ライブラリ（CDN）

| ライブラリ | 用途 | 読み込み箇所 |
|---|---|---|
| highlight.js 11.9.0 | コードシンタックスハイライト | index.html の `<head>` |
| html2canvas 1.4.1 | コンポーネントをPNG画像化（Figmaコピー用） | index.html の `</body>` 直前 |

---

## 現在の「Figmaボタン」の動作（変更予定）

現状: html2canvas でPNG画像をクリップボードにコピー（`captureComponentAsImage()`）

- カードの `.btn-figma[data-action="copy-figma"]` ボタン
- モーダルの `#btn-copy-figma` ボタン
- 関数: `catalog.js` 内の `captureComponentAsImage(comp)`

---

## ★ 次の開発タスク: Figmaプラグイン構築

### 目的

カタログサイトのコンポーネントをFigmaに**編集可能なレイヤー構造**でインポートできるようにする。

ユーザーのワークフロー:
```
コンポーネントをコーディング
  → カタログに登録
  → カタログの「Figma」ボタンでコンポーネントJSONをクリップボードにコピー
  → Figmaプラグインを起動してJSONをペースト
  → FigmaにHTML/CSSレイアウトが編集可能なレイヤーとして展開される
  → デザイナーがFigmaで調整
  → クライアントに確認
  → コーディング確定
```

### 作成するファイル

```
component-catalog/figma-plugin/
├── manifest.json   ← Figmaプラグイン定義
├── code.js         ← Figma Plugin API（ノード生成ロジック）
└── ui.html         ← プラグインUI（HTMLレンダリング + レイアウト抽出）
```

### 技術アプローチ

```
① カタログの「Figma」ボタン
    → コンポーネントJSON {name, html, css} をクリップボードにコピー（現在の画像コピーから変更）

② Figmaプラグイン（ui.html）
    → hidden iframe 内でコンポーネントをレンダリング
    → iframe内のDOM全要素に getBoundingClientRect() + getComputedStyle() を実行
    → 全要素の px値（x, y, width, height, 背景色, 文字色, 角丸, フォントサイズ等）を取得
    → ノードツリーを JSON として code.js に postMessage で送信

③ Figmaプラグイン（code.js）
    → figma.createFrame() / figma.createRectangle() / figma.createText() でFigmaノードを生成
    → サイズ・位置・色・角丸を絶対px値で設定
    → 画像要素は figma.createImage() で塗りつぶし（URL取得が必要）
```

### manifest.json の基本構造

```json
{
  "name": "Component Catalog Importer",
  "id": "component-catalog-importer",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}
```

### 注意事項

- Figma開発プラグインは **Figma Desktopアプリ** が必要（ブラウザ版不可）
- セットアップ: `Plugins → Development → Import plugin from manifest` で `figma-plugin/manifest.json` を選択（一人一回のみ）
- Figma Plugin API は `figma.` 名前空間（code.js 側でのみ利用可能）
- ui.html から code.js へのデータ送信は `parent.postMessage()` を使用
- code.js から ui.html へのデータ送信は `figma.ui.postMessage()` を使用

---

## 運用方針

- **閲覧**: GitHub Pages で全員に公開
- **編集**: 管理者のみ（ローカルで admin.html を操作 → JSONエクスポート → git push）
- `data/components.json` を更新して push すれば GitHub Pages に即反映

---

## 詳細仕様

→ **SPEC.md を必ず参照すること**
