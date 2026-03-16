# コンポーネントカタログ運用手順

## 1. 基本方針

このコンポーネントカタログは、`社内向け閲覧サイト` として社内サーバーで公開します。  
更新データの正本管理は `GitHub` で行います。

役割は以下のとおりです。

- `GitHub`
  ソースコード・`components.json` の正本管理
- `社内サーバー`
  社内メンバー向けの閲覧公開先
- `管理者`
  ローカル環境で `admin.html` を使って更新し、GitHub 経由で反映する

---

## 2. 社内サーバーに置くファイル

社内サーバーには、閲覧用に必要なファイルのみを配置します。

アップロード対象:

- `index.html`
- `assets/`
- `data/components.json`
- `data/components-data.js`
- 必要に応じて `figma-plugin/` や `docs/`

原則として、`admin.html` は社内サーバーに公開しません。

理由:

- 一般閲覧者に管理画面は不要
- 誤操作や意図しない編集導線を避けるため
- 管理画面は管理者のローカル作業用とするため

---

## 3. 更新の基本フロー

管理者は、社内サーバー上で直接編集するのではなく、ローカルで編集して GitHub に反映し、その後社内サーバーへ反映します。

更新フロー:

1. GitHub の `main` ブランチ最新を取得する
2. 作業ブランチを作成する
3. ローカルで `admin.html` を開く
4. コンポーネントを編集する
5. `data/components.json` を更新する
6. 変更内容を GitHub に push する
7. Pull Request を作成する
8. 別の管理者が確認する
9. `main` にマージする
10. `main` の内容を社内サーバーへアップロードする

---

## 4. 管理者向けの具体手順

### 作業開始前

必ず最新状態を取得します。

```bash
git checkout main
git pull origin main
```

その後、作業ブランチを作成します。

```bash
git checkout -b feature/update-components-20260312
```

### 編集作業

1. ローカルで `admin.html` を開く
2. コンポーネントを追加・編集・削除する
3. `JSONエクスポート` または `JSONファイルを開く` を使って `data/components.json` を更新する

### 変更確認

変更後は差分を確認します。

```bash
git status
git diff data/components.json
```

他のコンポーネントが意図せず消えていないかを確認してください。

### commit / push

問題なければ commit して GitHub に push します。

```bash
git add data/components.json
git commit -m "Update component catalog data"
git push origin feature/update-components-20260312
```

### Pull Request

GitHub 上で Pull Request を作成します。  
別の管理者 1 名が確認し、問題なければ `main` にマージします。

確認ポイント:

- 意図しない削除がないか
- JSON構造が壊れていないか
- 対象コンポーネント以外に不自然な差分がないか

---

## 5. 社内サーバーへの反映

`main` にマージされたら、社内サーバーへ公開ファイルを反映します。

アップロード対象:

- `index.html`
- `assets/`
- `data/components.json`
- `data/components-data.js`

通常、データ更新だけであれば最低限 `data/components.json` の差し替えで反映できます。  
ただし UI や機能変更がある場合は、関連ファイルもあわせてアップロードしてください。

---

## 6. 競合・先祖返りを防ぐルール

以下のルールを必須とします。

- 作業前に必ず `git pull origin main` を実行する
- `main` に直接 push しない
- 必ず作業ブランチを使う
- 必ず Pull Request を通す
- マージ前に差分確認を行う
- `components.json` を正本ファイルとして扱う

これにより、古いファイルで上書きして変更が消える `先祖返り` のリスクを減らせます。

---

## 7. この運用のメリット

- 社内メンバーは `index.html` を複数人で閲覧できる
- 管理画面を一般公開しないので安全
- 更新履歴が GitHub に残る
- 3人の管理者でも差分確認しながら安全に更新できる
- 問題があっても GitHub の履歴から戻せる

---

## 8. 補足

- `admin.html` はローカル専用とします
- 社内サーバーは閲覧専用の公開先とします
- GitHub は更新管理とレビューのために利用します
- 将来的に必要であれば、社内サーバーへの反映を自動化できます
