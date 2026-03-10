# 詳細仕様書

## data/components.json スキーマ

```json
{
  "categories": ["ボタン", "カード", "フォーム", "ナビゲーション", "モーダル", "テーブル", "バッジ", "その他"],
  "components": [
    {
      "id": "btn-primary-001",
      "name": "プライマリボタン",
      "category": "ボタン",
      "tags": ["button", "CTA", "primary"],
      "description": "説明文",
      "html": "HTMLコード",
      "css": "CSSコード",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    }
  ]
}
```

---

## index.html 仕様

### レイアウト

- ヘッダー: サイト名 + リアルタイム検索バー
- サイドバー（左 240px）: カテゴリ一覧（件数バッジ付き）+ タグクラウド
- メインエリア: コンポーネントカード グリッド表示

### コンポーネントカード

1. iframeプレビュー（srcdoc使用・高さ160px固定）
2. コンポーネント名・カテゴリ・タグ表示
3. 説明文（2行まで）
4. 「コードを見る」ボタン → モーダル表示
5. 「HTMLコピー」「CSSコピー」ボタン → クリップボードコピー＋トースト通知

### コードモーダル

- HTML / CSS タブ切り替え
- シンタックスハイライト（highlight.js を cdnjs CDNから読み込み）
- 「HTMLをコピー」「CSSをコピー」ボタン

### フィルタ・検索

- カテゴリ・タグクリックで絞り込み
- 検索バーで名前・説明・タグをリアルタイム絞り込み
- 「すべて表示」でリセット
- 結果件数を表示

---

## admin.html 仕様

### 機能

- コンポーネント一覧テーブル（名前・カテゴリ・登録日・編集・削除）
- 新規登録フォーム（下記フィールド）
  - ID（自動生成＋手動編集可）
  - 名前（必須）
  - カテゴリ（プルダウン）
  - タグ（カンマ区切り入力）
  - 説明文
  - HTML・CSS（テキストエリア）
  - 作成者名
- リアルタイムプレビュー（iframe・入力中に更新）
- JSONエクスポート（ダウンロード）
- JSONインポート（ファイルアップロード）

### データ管理フロー

1. 初回アクセス時: `data/components.json` を fetch して読み込む
2. 追加・編集: localStorage に一時保存
3. 確定: 「JSONをエクスポート」→ ダウンロード → `data/components.json` に上書き保存

---

## デザイン仕様

### CSS Variables（variables.css）

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
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### レスポンシブ

| 幅          | レイアウト                        |
| ----------- | --------------------------------- |
| 1024px以上  | サイドバー＋3列グリッド           |
| 768〜1023px | 2列グリッド・サイドバー折りたたみ |
| 767px以下   | 1列・ハンバーガーメニュー         |

### アニメーション

- カードホバー: `translateY(-2px)` + box-shadow強調
- コピー成功: 右下トースト通知（2秒表示）
- モーダル: フェードイン

---

## サンプルデータ要件

`components.json` に以下を各2〜3個含めること：

- ボタン（プライマリ・セカンダリ・デンジャー）
- カード（シンプル・プロフィール）
- フォーム（テキスト入力・セレクト）
- バッジ（ステータス4色）

※ サンプルデータは別途 `data/components.json` に用意済み

---

## README.md 記載事項

1. ローカル起動方法（Live Server推奨）
2. コンポーネント追加方法（管理画面 / JSON直接編集）
3. カテゴリ追加方法
4. デプロイ方法（GitHub Pages）
5. JSONスキーマ説明
