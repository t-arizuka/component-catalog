# 管理画面のサーバー上直接編集 — 実装方式の検討

## 背景・現状の課題

現在の `admin.html` は**ローカル専用**として設計されており、サーバーにアップロードしても編集内容をファイルに保存できない。

### 現在のデータフロー

```
ローカルで admin.html を操作
  ↓ 変更は localStorage（ブラウザ内）に一時保存
JSON エクスポート（ファイルをダウンロード）
  ↓
components.json を手動でサーバーにアップロード
```

### なぜサーバー上で編集できないのか

`admin.js` の保存処理（`saveToFile()`）は **File System Access API** を使用しており、ブラウザがローカルファイルに直接書き込む仕組みになっている。この API はサーバー上では使用できないため、保存が無効化される。

---

## 実装方式の選択肢

### 方式A — GitHub API 経由で直接更新（推奨）

ブラウザから GitHub REST API を叩いて `components.json` を直接書き換える。

#### メリット

- バックエンドサーバー不要（現在の Vanilla JS 構成を維持できる）
- 変更履歴が git コミットとして残る
- GitHub Pages に即反映される

#### デメリット

- Personal Access Token（PAT）の管理が必要
- Token をブラウザに持たせるため、`admin.html` を公開してはいけない
- GitHub に依存する（リポジトリを移行した場合に対応が必要）

#### 処理フロー

```
admin.html で編集・保存ボタンを押す
  ↓
GitHub API: GET /repos/{owner}/{repo}/contents/data/components.json
  ↓ 現在のファイルの SHA を取得
GitHub API: PUT（同エンドポイント）で Base64 エンコードした JSON を送信
  ↓
components.json が直接更新される → GitHub Pages に反映
```

#### 変更が必要なファイル

| ファイル | 変更内容 |
|---|---|
| `assets/js/admin.js` | `saveToFile()` を GitHub API 書き込みに置き換え |
| `admin.html` | GitHub Personal Access Token の入力欄を追加 |

#### APIコール例（参考）

```js
// 1. 現在の SHA を取得
const metaRes = await fetch(
  'https://api.github.com/repos/{owner}/{repo}/contents/data/components.json',
  { headers: { Authorization: `token ${githubToken}` } }
);
const { sha } = await metaRes.json();

// 2. ファイルを更新
await fetch(
  'https://api.github.com/repos/{owner}/{repo}/contents/data/components.json',
  {
    method: 'PUT',
    headers: {
      Authorization: `token ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'コンポーネントを更新',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
      sha,
    }),
  }
);
```

---

### 方式B — サーバーサイド API を立てる

PHP や Node.js などのサーバーサイドスクリプトで、`components.json` の読み書きを行うエンドポイントを作る。

#### メリット

- GitHub に依存しない
- 認証方式を自由に設計できる
- サーバー上のファイルをそのまま更新できる

#### デメリット

- **バックエンドの開発・運用が必要**（現在の構成から大きく変わる）
- サーバーサイド言語の環境構築が必要
- ファイルの書き込み権限をサーバー側で設定する必要がある
- 変更履歴が残らない（別途ログ設計が必要）

#### 処理フロー

```
admin.html で編集・保存ボタンを押す
  ↓
POST /api/save-components  ← サーバーサイドスクリプト
  ↓
サーバー上の components.json を上書き保存
```

---

### 方式C — 現状維持（手動アップロード）

現在の運用フローを変えず、編集 → エクスポート → FTP アップロードを続ける。

#### メリット

- 追加開発不要
- セキュリティリスクがない

#### デメリット

- 毎回の手動アップロードが手間
- 複数人が同時に編集すると競合が起きやすい

---

## 方式の比較

| 観点 | 方式A（GitHub API） | 方式B（サーバーAPI） | 方式C（現状維持） |
|---|---|---|---|
| 追加開発量 | 小（JS改修のみ） | 大（バックエンド新規） | なし |
| バックエンド不要 | ✅ | ❌ | ✅ |
| 変更履歴が残る | ✅（git） | ❌（要別途設計） | ✅（手動push） |
| Token管理が必要 | ✅ | ❌ | ❌ |
| GitHub依存 | あり | なし | あり |
| 複数人対応 | ✅ | ✅ | △ |

---

## 推奨案

**方式A（GitHub API）** を推奨。

理由：
- 現在の Vanilla JS / ビルド不要の構成を維持できる
- 変更履歴が git に残るため、誤操作時のロールバックが容易
- バックエンド開発が不要で、改修コストが最も小さい

### セキュリティ上の注意点

- `admin.html` は **公開 URL に置かない**こと（Basic 認証または IP 制限を推奨）
- GitHub PAT のスコープは `contents: write` のみに限定すること
- PAT は Fine-grained token（リポジトリ単位）を使用すること

---

## 今後の進め方（案）

1. 方式の合意
2. GitHub PAT の発行ポリシーを決定（個人 or 組織共有）
3. `admin.html` のアクセス制限方針を決定
4. `admin.js` の改修・テスト
5. 運用ルールのドキュメント化
