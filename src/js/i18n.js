(function (ns) {
  "use strict";

  const UI_LANG_STORAGE_KEY = "procedureEditor.uiLang";

  const MESSAGES = {
    ja: {
      // App shell / header
      "app.subtitle": "PC操作手順書をローカルHTMLだけで作成します。",
      "aria.editTabs": "編集タブ",
      "ui.new": "新規",
      "ui.loadHtml": "HTML読込",
      "ui.saveMarkdown": "Markdown保存",
      "ui.saveHtml": "HTML保存",
      "ui.print": "PDF/印刷",
      "ui.saved": "保存済み",
      "ui.unsaved": "未保存",

      // Tabs
      "tabs.cover": "表紙",
      "tabs.steps": "手順編集",
      "tabs.preview": "プレビュー",
      "tabs.markdown": "Markdown",

      // Cover tab (editor UI labels)
      "cover.sectionTitle": "表紙情報",
      "cover.title": "手順書名",
      "cover.targetWork": "対象作業",
      "cover.audience": "対象者",
      "cover.systemName": "使用システム",
      "cover.account": "必要な権限・アカウント",
      "cover.revision": "版数",
      "cover.createdAt": "作成日",
      "cover.updatedAt": "改訂日",
      "cover.author": "作成者",
      "cover.approver": "承認者",
      "cover.purpose": "目的",
      "cover.preparation": "事前準備",
      "cover.notes": "注意事項",
      "cover.docLang": "手順書の言語",

      // Steps tab
      "steps.listTitle": "STEP一覧",
      "steps.addStep": "STEP追加",
      "steps.emptyHint": "左の「STEP追加」から手順を作成してください。",
      "steps.title": "STEPタイトル",
      "steps.screen": "画面名",
      "steps.type": "STEPタイプ",
      "steps.type.normal": "通常",
      "steps.type.irregular": "非定常業務",
      "steps.type.error": "エラー対応",
      "steps.summary": "STEP概要",
      "steps.check": "注意・確認ポイント",
      "steps.emptyList": "STEPがありません。",
      "steps.emptyNormalList": "通常STEPがありません。",
      "ui.dividerIrregular": "非定常業務",
      "ui.dividerError": "エラー対応手順",
      "ui.badgeStep": "STEP {n}",
      "ui.badgeIrregular": "非定常 {n}",
      "ui.badgeError": "エラー対応 {n}",
      "ui.untitled": "無題",
      "ui.noScreenName": "画面名なし",
      "ui.blockCount": "ブロック {n}件",
      "ui.deleteStepTitle": "このSTEPを削除",
      "ui.selectStepHint": "STEPを選択してください。",
      "ui.noBlocksToSort": "並び替えるブロックがありません。",

      // Blocks
      "blocks.sectionTitle": "説明ブロック",
      "blocks.add": "ブロック追加",
      "blocks.emptyList": "説明ブロックがありません。",
      "ui.blockLabel": "ブロック {n}",
      "ui.moveUp": "上へ",
      "ui.moveDown": "下へ",
      "ui.delete": "削除",
      "fields.heading": "見出し",
      "fields.description": "説明",
      "ui.insertLink": "リンク埋め込み",
      "fields.parentStep": "帰属STEP",
      "fields.screenshot": "スクリーンショット",
      "ui.dropImage": "ここに画像をドロップ<br>またはクリックして選択",
      "ui.editAnnotations": "注釈編集",
      "ui.annotationCount": "注釈 {n}件",
      "ui.imageFallback": "画像",
      "ui.changeImage": "画像変更",
      "ui.deleteImage": "画像削除",

      // Block jump section
      "ui.jumpLabel": "↗ ジャンプ",
      "ui.noJumpTargets": "ジャンプ先のSTEPがありません",
      "ui.allJumpTargetsAdded": "すべてのジャンプ先STEPを追加済みです",
      "ui.selectPlaceholder": "選択...",
      "ui.add": "追加",

      // Sort pane
      "sort.title": "ブロック並び替え",
      "sort.hint": "ドラッグ&ドロップで現在のSTEP内の順序を変更できます。",

      // Markdown tab
      "markdown.title": "Markdown",
      "markdown.copy": "コピー",

      // Step import modal
      "import.title": "STEPをインポート",
      "import.hint": "追加するSTEPを選択してください。",
      "import.selectAll": "全選択",
      "import.replaceAll": "全て置き換える",
      "import.cancel": "キャンセル",
      "import.confirm": "選択STEPを追加",
      "import.type.normal": "通常",
      "import.type.irregular": "非定常",
      "import.type.error": "エラー",

      // Annotation modal
      "ui.annotationEdit": "注釈編集",
      "aria.annotationModal": "注釈編集",
      "ui.close": "閉じる",
      "ui.modeAdd": "＋ 追加",
      "ui.modeEdit": "✐ 編集",
      "ui.toolCircle": "○ 丸",
      "ui.toolArrow": "→ 矢印",
      "ui.toolNumber": "① 番号",
      "ui.toolMarker": "━ マーカー",
      "ui.deleteWithKey": "削除 <kbd>Del</kbd>",
      "aria.annotationColor": "注釈色",
      "ui.sizeLabel": "サイズ",
      "aria.numberAnnotation": "番号注釈",
      "aria.markerAnnotation": "マーカー注釈",
      "aria.circleAnnotation": "丸注釈",
      "aria.arrowAnnotation": "矢印注釈",

      // Toasts
      "toast.newProject": "新規手順書を作成しました。",
      "toast.selectJumpTarget": "ジャンプ先のSTEPを選択してください。",
      "toast.stepAdded": "STEPを追加しました。",
      "toast.stepDeleted": "STEPを削除しました。",
      "toast.blockAdded": "説明ブロックを追加しました。",
      "toast.blockDeleted": "説明ブロックを削除しました。",
      "toast.invalidLinkUrl": "http(s) または mailto のリンクURLを入力してください。",
      "toast.linkLabelRequired": "表示文言を入力してください。",
      "toast.imageAdded": "画像を追加しました。",
      "toast.blockMoved": "ブロックの帰属STEPを変更しました。",
      "toast.stepTypeChanged": "STEPタイプを変更しました。",
      "toast.jumpAlreadyAdded": "このエラー対応STEPへのジャンプはすでに追加されています。",
      "toast.jumpAdded": "ジャンプを追加しました。",
      "toast.noImageForAnnotation": "注釈を追加する画像がありません。",
      "toast.noImageToEditAnnotation": "注釈を編集する画像がありません。",
      "toast.selectAnnotationToDelete": "削除する注釈を選択してください。",
      "toast.jsonSaved": "JSONを保存しました。",
      "toast.jsonLoaded": "JSONを読み込みました。",
      "toast.viewerHtmlLoaded": "閲覧HTMLを読み込みました。",
      "toast.markdownSaved": "Markdownを保存しました。",
      "toast.markdownCopied": "Markdownをコピーしました。",
      "toast.noStepsToImport": "インポートするSTEPが見つかりませんでした。",
      "toast.noStepsSelected": "STEPが選択されていません。",
      "toast.stepsImported": "{n} 件のSTEPを追加しました。",
      "toast.htmlSaved": "HTMLを保存しました。",

      // Confirm / prompt / alert
      "confirm.newProject": "未保存の変更があります。新規作成しますか？",
      "confirm.deleteStep": "このSTEPを削除しますか？",
      "confirm.deleteBlock": "この説明ブロックを削除しますか？",
      "confirm.deleteImage": "画像と注釈を削除しますか？",
      "confirm.overwriteWithHtml": "未保存の変更があります。このHTMLで上書きしますか？",
      "prompt.linkUrl": "リンクURLを入力してください。",
      "prompt.linkLabel": "表示文言を入力してください。",
      "alert.jsonLoadFailed": "JSONを読み込めませんでした: ",
      "alert.viewerHtmlLoadFailed": "閲覧HTMLを読み込めませんでした: ",
      "alert.noEditorData": "このHTMLファイルにはProcedure Editorのデータが含まれていません。\n閲覧HTML出力で作成したファイルを選択してください。",

      // Hints (annotation placement)
      "hint.placeCircle": "画像上をクリックして○を配置してください。",
      "hint.placeNumber": "画像上をクリックして番号を配置してください。",
      "hint.placeArrow": "矢印の始点から終点までドラッグしてください。",
      "hint.placeMarker": "マーカーの開始位置から横にドラッグしてください。",

      // Document language (tDoc)
      "doc.newStep": "新しいSTEP {n}",
      "doc.newBlock": "操作説明 {n}",
      "doc.stepFallbackTitle": "STEP {n}",
      "doc.defaultCoverTitle": "PC操作手順書",
      "doc.cover.targetWork": "対象作業",
      "doc.cover.audience": "対象者",
      "doc.cover.systemName": "使用システム",
      "doc.cover.account": "必要な権限・アカウント",
      "doc.cover.revision": "版数",
      "doc.cover.createdAt": "作成日",
      "doc.cover.updatedAt": "改訂日",
      "doc.cover.author": "作成者",
      "doc.cover.approver": "承認者",
      "doc.cover.purpose": "目的",
      "doc.cover.preparation": "事前準備",
      "doc.cover.notes": "注意事項",
      "doc.section.procedureSteps": "操作手順",
      "doc.section.irregularSteps": "非定常業務手順",
      "doc.section.errorSteps": "エラー対応手順",
      "doc.screenNameLabel": "画面名:",
      "doc.screenName": "画面名",
      "doc.checkPoints": "注意・確認ポイント",
      "doc.stepsEmpty": "STEPがありません。",
      "doc.badgeStep": "STEP {n}",
      "doc.badgeIrregular": "非定常 {n}",
      "doc.badgeError": "エラー対応 {n}",
      "doc.annotationCount": "注釈 {n}件",
      "doc.jumpSettings": "↗ ジャンプ設定:",
      "doc.fileFallbackName": "手順書",
      "doc.viewOnlyLabel": "閲覧用手順書",
      "doc.searchPlaceholder": "検索",
      "doc.toc": "目次",
      "doc.coverInfo": "表紙情報",
      "doc.close": "閉じる",
      "doc.enlargeImage": "画像を拡大",
      "doc.backAriaLabel": "元の操作に戻る",
      "doc.backLabel": "元に戻る",
      "doc.screenshotAlt": "スクリーンショット",

      // Misc errors (utils.js)
      "error.cannotReadFile": "ファイルを読めませんでした。",
      "error.selectImageFile": "画像ファイルを選択してください。",
      "doc.fromPart": "部品: {title}",
      "doc.partMissing": "部品が見つかりません",
      "folder.toggle": "フォルダ",
      "folder.save": "保存",
      "folder.choose": "フォルダを選ぶ",
      "folder.reconnect": "フォルダに再接続",
      "folder.disconnect": "切断",
      "folder.connectedTo": "接続中: {name}",
      "folder.needsPermission": "「{name}」への接続に許可が必要です。「フォルダに再接続」を押してください。",
      "folder.none": "フォルダ未接続です。「フォルダを選ぶ」で手順書と部品の保存先を選べます。",
      "folder.docs": "手順書",
      "folder.parts": "部品",
      "folder.noDocs": "手順書がありません。",
      "folder.noParts": "部品がありません。",
      "folder.newPart": "新しい部品",
      "folder.refresh": "更新",
      "folder.current": "開いているファイル: {path}",
      "folder.currentNone": "開いているファイル: (フォルダ外)",
      "folder.listFailed": "一覧を取得できませんでした: ",
      "folder.openFailed": "ファイルを開けませんでした: ",
      "folder.saved": "{path} に保存しました",
      "folder.saveFailed": "保存に失敗しました: ",
      "folder.connectFailed": "フォルダに接続できませんでした: ",
      "parts.badge": "部品",
      "parts.missing": "部品が見つかりません",
      "parts.offline": "フォルダ未接続・控えを表示",
      "parts.stepCount": "{n} STEP",
      "parts.open": "部品を開く",
      "parts.removeRef": "印を外す",
      "parts.insert": "部品を入れる",
      "parts.pickTitle": "部品を選ぶ",
      "parts.pickHint": "手順書に入れる部品を選んでください。",
      "parts.pickEmpty": "部品がありません。「新しい部品」で作成して保存してください。",
      "parts.cancel": "キャンセル",
      "parts.editingBanner": "部品を編集中: 保存すると使っている手順書を出し直します",
      "parts.readonlyHint": "部品の内容は読み取り専用です。直すときは「部品を開く」から編集してください。",
      "parts.republished": "{n} 本の手順書を出し直しました",
      "parts.republishFailed": "出し直せなかった手順書:",
      "parts.synced": "{n} 件の部品を最新の内容に更新しました",
      "parts.missingToast": "見つからない部品があります: {titles}",
      "parts.syncFailed": "部品の確認に失敗しました: ",
      "parts.nested": "部品の中に部品は入れられません。",
      "parts.notAPart": "部品ではないファイルです。",
      "parts.inserted": "部品を入れました",
      "parts.defaultTitle": "新しい部品",
      "confirm.removeRef": "この部品を手順書から外します。部品ファイルは消えません。よろしいですか？",
      "confirm.discardForOpen": "未保存の変更があります。破棄して開きますか？",
      "notice.close": "閉じる",
      "error.cannotReadImage": "画像を読めませんでした。"
    },
    en: {
      "app.subtitle": "Create PC operation procedure manuals with a local-only HTML app.",
      "aria.editTabs": "Edit tabs",
      "ui.new": "New",
      "ui.loadHtml": "Load HTML",
      "ui.saveMarkdown": "Save Markdown",
      "ui.saveHtml": "Save HTML",
      "ui.print": "PDF / Print",
      "ui.saved": "Saved",
      "ui.unsaved": "Unsaved",

      "tabs.cover": "Cover",
      "tabs.steps": "Steps",
      "tabs.preview": "Preview",
      "tabs.markdown": "Markdown",

      "cover.sectionTitle": "Cover Information",
      "cover.title": "Document Title",
      "cover.targetWork": "Target Task",
      "cover.audience": "Audience",
      "cover.systemName": "System",
      "cover.account": "Required Permissions / Accounts",
      "cover.revision": "Version",
      "cover.createdAt": "Created",
      "cover.updatedAt": "Revised",
      "cover.author": "Author",
      "cover.approver": "Approver",
      "cover.purpose": "Purpose",
      "cover.preparation": "Preparation",
      "cover.notes": "Precautions",
      "cover.docLang": "Document Language",

      "steps.listTitle": "STEP List",
      "steps.addStep": "Add STEP",
      "steps.emptyHint": "Use \"Add STEP\" on the left to create a step.",
      "steps.title": "STEP Title",
      "steps.screen": "Screen Name",
      "steps.type": "STEP Type",
      "steps.type.normal": "Normal",
      "steps.type.irregular": "Non-routine",
      "steps.type.error": "Error Handling",
      "steps.summary": "STEP Summary",
      "steps.check": "Cautions & Checkpoints",
      "steps.emptyList": "No STEPs yet.",
      "steps.emptyNormalList": "No normal STEPs yet.",
      "ui.dividerIrregular": "Non-routine",
      "ui.dividerError": "Error Handling Procedures",
      "ui.badgeStep": "STEP {n}",
      "ui.badgeIrregular": "Non-routine {n}",
      "ui.badgeError": "Error {n}",
      "ui.untitled": "Untitled",
      "ui.noScreenName": "No screen name",
      "ui.blockCount": "{n} block(s)",
      "ui.deleteStepTitle": "Delete this STEP",
      "ui.selectStepHint": "Select a STEP.",
      "ui.noBlocksToSort": "No blocks to reorder.",

      "blocks.sectionTitle": "Instruction Blocks",
      "blocks.add": "Add Block",
      "blocks.emptyList": "No instruction blocks yet.",
      "ui.blockLabel": "Block {n}",
      "ui.moveUp": "Up",
      "ui.moveDown": "Down",
      "ui.delete": "Delete",
      "fields.heading": "Heading",
      "fields.description": "Description",
      "ui.insertLink": "Insert Link",
      "fields.parentStep": "Parent STEP",
      "fields.screenshot": "Screenshot",
      "ui.dropImage": "Drop an image here<br>or click to select",
      "ui.editAnnotations": "Edit Annotations",
      "ui.annotationCount": "{n} annotation(s)",
      "ui.imageFallback": "Image",
      "ui.changeImage": "Change Image",
      "ui.deleteImage": "Delete Image",

      "ui.jumpLabel": "↗ Jump",
      "ui.noJumpTargets": "No jump-target STEPs available",
      "ui.allJumpTargetsAdded": "All jump-target STEPs have been added",
      "ui.selectPlaceholder": "Select...",
      "ui.add": "Add",

      "sort.title": "Reorder Blocks",
      "sort.hint": "Drag and drop to reorder blocks within the current STEP.",

      "markdown.title": "Markdown",
      "markdown.copy": "Copy",

      "import.title": "Import STEPs",
      "import.hint": "Select the STEPs to add.",
      "import.selectAll": "Select All",
      "import.replaceAll": "Replace All",
      "import.cancel": "Cancel",
      "import.confirm": "Add Selected STEPs",
      "import.type.normal": "Normal",
      "import.type.irregular": "Non-routine",
      "import.type.error": "Error",

      "ui.annotationEdit": "Edit Annotations",
      "aria.annotationModal": "Edit Annotations",
      "ui.close": "Close",
      "ui.modeAdd": "+ Add",
      "ui.modeEdit": "✐ Edit",
      "ui.toolCircle": "○ Circle",
      "ui.toolArrow": "→ Arrow",
      "ui.toolNumber": "① Number",
      "ui.toolMarker": "━ Marker",
      "ui.deleteWithKey": "Delete <kbd>Del</kbd>",
      "aria.annotationColor": "Annotation color",
      "ui.sizeLabel": "Size",
      "aria.numberAnnotation": "Number annotation",
      "aria.markerAnnotation": "Marker annotation",
      "aria.circleAnnotation": "Circle annotation",
      "aria.arrowAnnotation": "Arrow annotation",

      "toast.newProject": "Created a new procedure manual.",
      "toast.selectJumpTarget": "Select a jump-target STEP.",
      "toast.stepAdded": "STEP added.",
      "toast.stepDeleted": "STEP deleted.",
      "toast.blockAdded": "Instruction block added.",
      "toast.blockDeleted": "Instruction block deleted.",
      "toast.invalidLinkUrl": "Enter an http(s) or mailto link URL.",
      "toast.linkLabelRequired": "Enter display text.",
      "toast.imageAdded": "Image added.",
      "toast.blockMoved": "Moved the block to another STEP.",
      "toast.stepTypeChanged": "STEP type changed.",
      "toast.jumpAlreadyAdded": "A jump to this error-handling STEP has already been added.",
      "toast.jumpAdded": "Jump added.",
      "toast.noImageForAnnotation": "No image to annotate.",
      "toast.noImageToEditAnnotation": "No image to edit annotations for.",
      "toast.selectAnnotationToDelete": "Select an annotation to delete.",
      "toast.jsonSaved": "Saved JSON.",
      "toast.jsonLoaded": "Loaded JSON.",
      "toast.viewerHtmlLoaded": "Loaded the view-only HTML.",
      "toast.markdownSaved": "Saved Markdown.",
      "toast.markdownCopied": "Copied Markdown.",
      "toast.noStepsToImport": "No STEPs found to import.",
      "toast.noStepsSelected": "No STEPs selected.",
      "toast.stepsImported": "Added {n} STEP(s).",
      "toast.htmlSaved": "Saved HTML.",

      "confirm.newProject": "You have unsaved changes. Start a new document anyway?",
      "confirm.deleteStep": "Delete this STEP?",
      "confirm.deleteBlock": "Delete this instruction block?",
      "confirm.deleteImage": "Delete the image and its annotations?",
      "confirm.overwriteWithHtml": "You have unsaved changes. Overwrite with this HTML?",
      "prompt.linkUrl": "Enter the link URL.",
      "prompt.linkLabel": "Enter display text.",
      "alert.jsonLoadFailed": "Could not load JSON: ",
      "alert.viewerHtmlLoadFailed": "Could not load the view-only HTML: ",
      "alert.noEditorData": "This HTML file does not contain Procedure Editor data.\nPlease select a file created with view-only HTML export.",

      "hint.placeCircle": "Click on the image to place a circle.",
      "hint.placeNumber": "Click on the image to place a number.",
      "hint.placeArrow": "Drag from the arrow's start point to its end point.",
      "hint.placeMarker": "Drag sideways from the marker's start position.",

      "doc.newStep": "New STEP {n}",
      "doc.newBlock": "Instruction {n}",
      "doc.stepFallbackTitle": "STEP {n}",
      "doc.defaultCoverTitle": "PC Operation Procedure Manual",
      "doc.cover.targetWork": "Target Task",
      "doc.cover.audience": "Audience",
      "doc.cover.systemName": "System",
      "doc.cover.account": "Required Permissions / Accounts",
      "doc.cover.revision": "Version",
      "doc.cover.createdAt": "Created",
      "doc.cover.updatedAt": "Revised",
      "doc.cover.author": "Author",
      "doc.cover.approver": "Approver",
      "doc.cover.purpose": "Purpose",
      "doc.cover.preparation": "Preparation",
      "doc.cover.notes": "Precautions",
      "doc.section.procedureSteps": "Procedure Steps",
      "doc.section.irregularSteps": "Non-routine Procedures",
      "doc.section.errorSteps": "Error Handling Procedures",
      "doc.screenNameLabel": "Screen:",
      "doc.screenName": "Screen Name",
      "doc.checkPoints": "Cautions & Checkpoints",
      "doc.stepsEmpty": "No STEPs yet.",
      "doc.badgeStep": "STEP {n}",
      "doc.badgeIrregular": "Non-routine {n}",
      "doc.badgeError": "Error {n}",
      "doc.annotationCount": "{n} annotation(s)",
      "doc.jumpSettings": "↗ Jump targets:",
      "doc.fileFallbackName": "procedure",
      "doc.viewOnlyLabel": "View-only Procedure Manual",
      "doc.searchPlaceholder": "Search",
      "doc.toc": "Table of Contents",
      "doc.coverInfo": "Cover Information",
      "doc.close": "Close",
      "doc.enlargeImage": "Enlarge image",
      "doc.backAriaLabel": "Back to original step",
      "doc.backLabel": "Back",
      "doc.screenshotAlt": "Screenshot",

      "error.cannotReadFile": "Could not read the file.",
      "error.selectImageFile": "Select an image file.",
      "doc.fromPart": "Part: {title}",
      "doc.partMissing": "Part not found",
      "folder.toggle": "Folder",
      "folder.save": "Save",
      "folder.choose": "Choose folder",
      "folder.reconnect": "Reconnect folder",
      "folder.disconnect": "Disconnect",
      "folder.connectedTo": "Connected: {name}",
      "folder.needsPermission": "Permission is needed to access \"{name}\". Press \"Reconnect folder\".",
      "folder.none": "No folder connected. Choose a folder to store procedures and parts.",
      "folder.docs": "Procedures",
      "folder.parts": "Parts",
      "folder.noDocs": "No procedures.",
      "folder.noParts": "No parts.",
      "folder.newPart": "New part",
      "folder.refresh": "Refresh",
      "folder.current": "Open file: {path}",
      "folder.currentNone": "Open file: (not from the folder)",
      "folder.listFailed": "Could not list files: ",
      "folder.openFailed": "Could not open the file: ",
      "folder.saved": "Saved to {path}",
      "folder.saveFailed": "Save failed: ",
      "folder.connectFailed": "Could not connect to the folder: ",
      "parts.badge": "Part",
      "parts.missing": "Part not found",
      "parts.offline": "Folder not connected - showing saved copy",
      "parts.stepCount": "{n} STEP",
      "parts.open": "Open part",
      "parts.removeRef": "Remove part",
      "parts.insert": "Insert part",
      "parts.pickTitle": "Choose a part",
      "parts.pickHint": "Select a part to insert into this procedure.",
      "parts.pickEmpty": "No parts yet. Create one with \"New part\" and save it.",
      "parts.cancel": "Cancel",
      "parts.editingBanner": "Editing a part: saving re-exports the procedures that use it",
      "parts.readonlyHint": "Part content is read-only. Use \"Open part\" to edit it.",
      "parts.republished": "Re-exported {n} procedure(s)",
      "parts.republishFailed": "Procedures that could not be re-exported:",
      "parts.synced": "Updated {n} part(s) to the latest content",
      "parts.missingToast": "Some parts were not found: {titles}",
      "parts.syncFailed": "Could not check parts: ",
      "parts.nested": "A part cannot contain another part.",
      "parts.notAPart": "This file is not a part.",
      "parts.inserted": "Part inserted",
      "parts.defaultTitle": "New part",
      "confirm.removeRef": "Remove this part from the procedure? The part file itself is not deleted.",
      "confirm.discardForOpen": "You have unsaved changes. Discard them and open?",
      "notice.close": "Close",
      "error.cannotReadImage": "Could not read the image."
    }
  };

  function getUiLang() {
    try {
      const stored = window.localStorage.getItem(UI_LANG_STORAGE_KEY);
      return stored === "en" ? "en" : "ja";
    } catch (error) {
      return "ja";
    }
  }

  function setUiLang(lang) {
    const next = lang === "en" ? "en" : "ja";
    try {
      window.localStorage.setItem(UI_LANG_STORAGE_KEY, next);
    } catch (error) {
      /* localStorage unavailable, ignore */
    }
    return next;
  }

  function getDocLang() {
    return ns.state && ns.state.store && ns.state.store.project && ns.state.store.project.docLang === "en"
      ? "en"
      : "ja";
  }

  function interpolate(template, vars) {
    if (!vars) return template;
    return String(template).replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match;
    });
  }

  function resolve(lang, key, vars) {
    const dict = MESSAGES[lang] || MESSAGES.ja;
    const template = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : (MESSAGES.ja[key] || key);
    return interpolate(template, vars);
  }

  function t(key, vars) {
    return resolve(getUiLang(), key, vars);
  }

  function tDoc(key, vars) {
    return resolve(getDocLang(), key, vars);
  }

  // Resolve a message for an explicitly given language, bypassing the
  // "current" ui/doc language lookup. Needed when generating defaults for a
  // project that is being created/normalized and is not yet the active
  // project in the store (so getDocLang() would still see the previous one).
  function message(lang, key, vars) {
    return resolve(lang === "en" ? "en" : "ja", key, vars);
  }

  function applyStaticTranslations() {
    document.documentElement.lang = getUiLang();

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
      node.setAttribute("title", t(node.getAttribute("data-i18n-title")));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (node) {
      node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria-label")));
    });
  }

  ns.i18n = {
    MESSAGES,
    getUiLang,
    setUiLang,
    getDocLang,
    t,
    tDoc,
    message,
    applyStaticTranslations
  };
})(window.ProcedureEditor = window.ProcedureEditor || {});
