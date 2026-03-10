# 社内コンポーネントカタログ

デザイナー・コーダー向けの社内HTMLコンポーネントカタログサイトです。
ビルド不要・依存ゼロの Vanilla JS / CSS で動作します。

---

## 1. ローカル起動方法

### Live Server（推奨）

1. VS Code に [Live Server 拡張機能](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) をインストール
2. `index.html` を右クリック →「Open with Live Server」
3. ブラウザで `http://127.0.0.1:5500/index.html` が開きます

### Python 簡易サーバー

```bash
# Python 3
python -m http.server 8080
# → http://localhost:8080
```

> **注意:** `file://` プロトコルでの直接開きは `fetch` が動作しないため非推奨です。

---

## 2. コンポーネントの追加方法

### 方法 A: 管理画面から登録

1. `admin.html` を開く
2. 「新規登録」ボタンをクリック
3. フォームに各フィールドを入力（右側のプレビューでリアルタイム確認可能）
4. 「保存する」でローカルに一時保存
5. 「JSONをエクスポート」でダウンロード → `data/components.json` に上書き保存

### 方法 B: JSONを直接編集

`data/components.json` を開き、`components` 配列に以下のオブジェクトを追加します。

```json
{
  "id": "btn-002",
  "name": "ゴーストボタン",
  "category": "ボタン",
  "tags": ["button", "ghost", "transparent"],
  "description": "背景なしのシンプルなボタン",
  "html": "<button class=\"btn-ghost\">ボタン</button>",
  "css": ".btn-ghost { ... }",
  "author": "デザインチーム",
  "createdAt": "2026-03-09",
  "updatedAt": "2026-03-09"
}
```

---

## 3. カテゴリの追加方法

`data/components.json` の `categories` 配列に追加します。

```json
{
  "categories": [
    "ボタン",
    "カード",
    "フォーム",
    "ナビゲーション",
    "モーダル",
    "テーブル",
    "バッジ",
    "その他",
    "新カテゴリ名"   ← ここに追加
  ]
}
```

---

## 4. デプロイ方法（GitHub Pages）

1. リポジトリの `Settings` → `Pages` を開く
2. Source を `Deploy from a branch` に設定
3. Branch: `main` / Folder: `/ (root)` を選択して「Save」
4. 数分後に `https://<username>.github.io/<repo>/` で公開されます

---

## 5. JSON スキーマ

`data/components.json` のスキーマ定義です。

| フィールド    | 型       | 必須 | 説明                              |
|--------------|----------|------|-----------------------------------|
| `id`         | string   | ✓    | 一意の識別子（例: `btn-001`）     |
| `name`       | string   | ✓    | コンポーネント名                  |
| `category`   | string   | ✓    | categories に含まれる文字列       |
| `tags`       | string[] |      | 検索・フィルタ用タグ              |
| `description`| string   |      | コンポーネントの説明文            |
| `html`       | string   |      | プレビュー・コピー用 HTML         |
| `css`        | string   |      | プレビュー・コピー用 CSS          |
| `author`     | string   |      | 作成者名                          |
| `createdAt`  | string   |      | 作成日（YYYY-MM-DD）              |
| `updatedAt`  | string   |      | 更新日（YYYY-MM-DD）              |

---

## ファイル構成

```
component-catalog/
├── index.html          # カタログ一覧ページ
├── admin.html          # 管理画面
├── data/
│   └── components.json # コンポーネントデータ（唯一のデータソース）
├── assets/
│   ├── css/
│   │   ├── variables.css  # CSS変数
│   │   ├── style.css      # カタログページスタイル
│   │   └── admin.css      # 管理画面スタイル
│   └── js/
│       ├── utils.js       # 共通ユーティリティ
│       ├── catalog.js     # カタログページ処理
│       └── admin.js       # 管理画面処理
├── SPEC.md             # 詳細仕様書
└── README.md           # このファイル
```
