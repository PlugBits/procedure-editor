# Procedure Editor

PC操作手順書を作成するための静的Webアプリです。サーバー不要で、`index.html` をブラウザで開くだけで動作します。

## 使い方

1. `index.html` をブラウザで開きます。
2. 表紙情報、STEP、説明ブロックを入力します。
3. スクリーンショットはファイル選択、ドラッグ&ドロップ、または `Ctrl+V` で貼り付けできます。
4. 必要に応じて画像に `○`、矢印、番号、マーカーの注釈を追加します。
5. JSON保存、Markdown保存、PDF/印刷、閲覧HTML出力を実行します。

## 主な機能

- 表紙情報入力
- STEP追加、削除、並び替え
- 説明ブロック追加、削除、並び替え
- 3カラム編集UI
- スクリーンショット貼付
- 画像注釈の追加、移動、サイズ変更
- 説明ブロックの帰属STEP移動
- Markdown出力
- JSON保存、JSON読込
- 未保存警告
- PDF/印刷
- 閲覧用単一HTML出力

## 言語設定（UI言語と手順書言語）

このアプリには独立した2つの言語設定があります。

- **UI言語**（ヘッダー右上の切替ボタン）: エディタ画面自体の表示言語です。`ja`/`en` を切り替えでき、選択内容はブラウザの `localStorage` に保存されます。STEP一覧、ブロックカード、注釈編集モーダル、トースト通知、確認ダイアログなどエディタの操作画面に反映されます。
- **手順書言語**（表紙タブの「手順書の言語」欄）: 作成する手順書（成果物）の言語です。プロジェクトデータに `docLang` として保存され、JSON保存・読込や閲覧HTML出力でも維持されます。プレビュー表示、Markdown出力、閲覧用HTML出力、保存ファイル名のフォールバック、新規STEP/ブロックのデフォルトタイトルに反映されます。

この2つは独立しているため、例えば「エディタ画面は英語で操作しながら、日本語の手順書を作成する」といった使い方も可能です。

## Language settings (UI language vs. document language)

This app has two independent language settings:

- **UI language** (toggle button in the header): controls the language of the editor screen itself (`ja`/`en`), persisted in the browser's `localStorage`.
- **Document language** (the "Document Language" field on the Cover tab): controls the language of the procedure manual you are producing. It is stored as `docLang` in the project data (JSON / view-only HTML) and drives the Preview, Markdown output, view-only HTML export, default STEP/block titles, and the fallback save file name.

Because the two are independent, you can, for example, operate the editor UI in English while authoring a Japanese-language procedure manual, or vice versa.

## ファイル構成

```text
procedure-editor/
├─ index.html
├─ README.md
├─ src/
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     ├─ app.js
│     ├─ i18n.js
│     ├─ state.js
│     ├─ render.js
│     ├─ blocks.js
│     ├─ annotations.js
│     ├─ export.js
│     ├─ viewerExport.js
│     └─ utils.js
└─ sample/
   └─ sample.json
```

## 保存形式

JSON保存時のファイル名は次の形式です。

```text
手順書名_YYYYMMDD_HHMMSS.json
```

手順書名が未入力の場合のフォールバック名は手順書言語に応じて変わります（日本語: `手順書`、英語: `procedure`）。

閲覧用HTMLは単一HTMLファイルとして出力され、画像はbase64で埋め込まれます。出力されるHTMLの `lang` 属性および全文言は、手順書言語（`docLang`）に従います。
