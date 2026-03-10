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

## 現在の運用方針

- **閲覧**: GitHub Pages で全員に公開（`https://t-arizuka.github.io/component-catalog/`）
- **編集**: 管理者のみ（ローカルで admin.html を操作 → JSON エクスポート → git push）
- `data/components.json` を更新して push すれば GitHub Pages に即反映される

## 将来の移行計画：複数人での編集対応

現在の Vanilla JS 構成を維持したまま、**GitHub REST API 経由での直接書き込み**に移行する予定。

### 移行方針（GitHub API 方式）

- ブラウザから GitHub API を叩いて `data/components.json` を直接更新する
- バックエンドサーバー不要・Vanilla JS のまま対応可能
- 変更履歴が git コミットとして残る

### 移行時に変更が必要なファイル

| ファイル | 変更内容 |
|---|---|
| `assets/js/admin.js` | `saveToStorage()` を GitHub API 書き込みに置き換え |
| `admin.html` | GitHub Personal Access Token の入力欄を追加（またはセッション保存） |
| `data/components.json` | データソースはそのまま流用 |

### GitHub API での JSON 更新フロー（参考）
```js
// PUT /repos/{owner}/{repo}/contents/{path}
await fetch('https://api.github.com/repos/t-arizuka/component-catalog/contents/data/components.json', {
  method: 'PUT',
  headers: {
    'Authorization': `token ${githubToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'コンポーネントを更新',
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    sha: currentFileSha,  // 既存ファイルの SHA が必要
  }),
});
```
