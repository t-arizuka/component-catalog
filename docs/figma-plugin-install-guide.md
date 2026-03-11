# Component Catalog Importer 導入手順

## 概要

`Component Catalog Importer` は、社内コンポーネントカタログの HTML / CSS を Figma に取り込むための開発用プラグインです。

このプラグインは `Figma Desktop アプリ` でのみ使用できます。  
`ブラウザ版 Figma` では利用できません。

---

## 事前に必要なもの

- `Figma Desktop アプリ`
- 配布された ZIP ファイル
- Windows PC

---

## 1. ZIP ファイルを展開する

配布された ZIP ファイルを、次の固定フォルダに展開してください。

`C:\company-tools\component-catalog\`

展開後、以下のファイルがあることを確認してください。

`C:\company-tools\component-catalog\figma-plugin\manifest.json`

注意:

- フォルダ名は変更しないでください
- `figma-plugin` フォルダの場所を移動しないでください
- ZIP のままでは使えません。必ず展開してください

---

## 2. Figma Desktop アプリを開く

`Figma Desktop アプリ` を起動してください。

ブラウザ版では動作しません。

---

## 3. プラグインを初回登録する

Figma Desktop アプリで、上部メニューから次を開きます。

`Plugins` → `Development` → `Import plugin from manifest...`

ファイル選択画面が開いたら、次のファイルを選択してください。

`C:\company-tools\component-catalog\figma-plugin\manifest.json`

正常に登録されると、Figma の Development Plugins 一覧に `Component Catalog Importer` が表示されます。

この操作は `最初の1回だけ` です。

---

## 4. プラグインを使う

### カタログ側

1. 社内コンポーネントカタログを開きます
2. 使いたいコンポーネントの `Figma` ボタンを押します
3. コンポーネント情報がコピーされます

### Figma 側

1. Figma Desktop で任意のファイルを開きます
2. 上部メニューから次を開きます

`Plugins` → `Development` → `Component Catalog Importer`

3. 開いたプラグイン画面の入力欄をクリックします
4. `Ctrl + V` で貼り付けます
5. `Figmaに展開` を押します

正常に動作すると、Figma のキャンバス上にコンポーネントが展開されます。

---

## 5. 更新があった場合

新しい ZIP ファイルが配布された場合は、以下の手順で更新してください。

1. 既存の `C:\company-tools\component-catalog\` を新しいファイルで上書きします
2. Figma Desktop を再起動します
3. 再度プラグインを開いて利用します

通常は `manifest.json` の再登録は不要です。  
ただし、更新後にプラグインが正常に開かない場合は、もう一度次を実行してください。

`Plugins` → `Development` → `Import plugin from manifest...`

---

## よくある質問

### Q. プラグインが見つかりません

A. 初回登録が完了していない可能性があります。次を実行してください。

`Plugins` → `Development` → `Import plugin from manifest...`

その後、以下のファイルを選択してください。

`C:\company-tools\component-catalog\figma-plugin\manifest.json`

### Q. プラグインを開いたが、何をすればいいですか？

A. 入力欄をクリックして、`Ctrl + V` で貼り付けてください。  
その後、`Figmaに展開` を押してください。

### Q. ブラウザ版 Figma では使えますか？

A. 使えません。`Figma Desktop アプリ` を使用してください。

### Q. 展開結果が少し崩れることがあります

A. HTML / CSS の表現を Figma 用に変換しているため、完全一致しない場合があります。特に、装飾や複雑なレイアウトは差が出ることがあります。

---

## 問い合わせ先

不明点がある場合は、社内担当者まで連絡してください。

- 担当:
- 連絡先:
