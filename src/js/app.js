(function (ns) {
  "use strict";

  const utils = ns.utils;
  const state = ns.state;
  const t = function (key, vars) { return ns.i18n.t(key, vars); };
  let draggedBlockId = null;
  let draggedStepId = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    ns.i18n.applyStaticTranslations();
    bindEvents();
    ns.render.renderAll();
    updateUiLangToggleLabel();
    initFolder();
  }

  function updateUiLangToggleLabel() {
    const toggle = utils.$("uiLangToggle");
    if (!toggle) return;
    toggle.textContent = ns.i18n.getUiLang() === "en" ? "日本語" : "English";
  }

  function bindEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("pointerdown", ns.annotations.handlePointerDown);
    document.addEventListener("pointermove", ns.annotations.handlePointerMove);
    document.addEventListener("pointerup", ns.annotations.handlePointerUp);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);
  }

  function handleClick(event) {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      ns.render.showTab(tab.dataset.tab);
      return;
    }

    const actionNode = event.target.closest("[data-action]");
    if (actionNode) {
      const action = actionNode.dataset.action;
      switch (action) {
        case "toggle-ui-lang":
          toggleUiLang();
          return;
        case "new-project":
          newProject();
          return;
        case "toggle-folder-panel":
          folderPanelOpen = !folderPanelOpen;
          renderFolderUi();
          if (folderPanelOpen) refreshFolderLists();
          return;
        case "folder-pick":
          folderPick();
          return;
        case "folder-reconnect":
          folderReconnect();
          return;
        case "folder-disconnect":
          folderDisconnect();
          return;
        case "folder-refresh":
          refreshFolderLists();
          return;
        case "save-folder":
          saveToFolder();
          return;
        case "open-folder-file":
          openFromFolder(actionNode.dataset.path, actionNode.dataset.kind);
          return;
        case "new-part":
          newPart();
          return;
        case "insert-part":
          showPartPicker();
          return;
        case "pick-part":
          insertPart(actionNode.dataset.path);
          return;
        case "cancel-part-picker":
          closePartPicker();
          return;
        case "open-part": {
          const found = state.findStepById(actionNode.dataset.stepId);
          if (found && found.step.ref) openFromFolder(found.step.ref.file, "part");
          return;
        }
        case "remove-ref":
          removeRef(actionNode.dataset.stepId);
          return;
        case "close-notice":
          hideNotice();
          return;
        case "download-markdown":
          ns.exporter.downloadMarkdown();
          return;
        case "copy-markdown":
          ns.exporter.copyMarkdown();
          return;
        case "export-viewer":
          ns.viewerExport.exportViewerHtml();
          return;
        case "confirm-step-import":
          ns.exporter.confirmStepImport();
          return;
        case "replace-all-import":
          ns.exporter.replaceAllImport();
          return;
        case "cancel-step-import":
          ns.exporter.cancelStepImport();
          return;
        case "print":
          ns.exporter.printDocument();
          return;
        case "add-step":
          ns.blocks.addStep();
          return;
        case "delete-step":
          ns.blocks.deleteStep(actionNode.dataset.stepId || state.store.currentStepId);
          return;
        case "move-step":
          ns.blocks.moveCurrentStep(Number(actionNode.dataset.dir));
          return;
        case "select-step":
          selectStep(actionNode.dataset.stepId);
          return;
        case "add-block":
          ns.blocks.addBlock();
          return;
        case "delete-block":
          ns.blocks.deleteBlock(actionNode.dataset.blockId);
          return;
        case "move-block":
          ns.blocks.moveBlock(actionNode.dataset.blockId, Number(actionNode.dataset.dir));
          return;
        case "clear-block-image":
          ns.blocks.clearBlockImage(actionNode.dataset.blockId);
          return;
        case "insert-block-link":
          ns.blocks.insertBlockLink(actionNode.dataset.blockId);
          return;
        case "open-annotation-modal":
          ns.annotations.openAnnotationModal(actionNode.dataset.blockId);
          return;
        case "close-annotation-modal":
          ns.annotations.closeAnnotationModal();
          return;
        case "add-annotation":
          ns.annotations.addAnnotation(actionNode.dataset.type, actionNode.dataset.blockId);
          return;
        case "set-annotation-color":
          ns.annotations.setAnnotationColor(actionNode.dataset.color, actionNode.dataset.blockId);
          return;
        case "delete-annotation":
          state.store.currentBlockId = actionNode.dataset.blockId;
          ns.annotations.deleteSelectedAnnotation();
          return;
        case "set-annotation-mode":
          ns.annotations.setAnnotationMode(actionNode.dataset.mode);
          return;
        case "add-block-jump": {
          const card = actionNode.closest("article");
          const select = card && card.querySelector("[data-jump-step-select]");
          const targetStepId = select && select.value;
          if (targetStepId) {
            ns.blocks.addJumpToBlock(actionNode.dataset.blockId, targetStepId);
          } else {
            utils.toast(t("toast.selectJumpTarget"));
          }
          return;
        }
        case "delete-block-jump":
          ns.blocks.removeJumpFromBlock(actionNode.dataset.blockId, actionNode.dataset.jumpId);
          return;
        default:
          break;
      }
    }

    const sortItem = event.target.closest("[data-sort-block-id]");
    if (sortItem) {
      selectBlock(sortItem.dataset.sortBlockId);
      return;
    }

    const block = event.target.closest("[data-block-id]");
    if (block && !event.target.closest("input, textarea, select, button, label, .annotation")) {
      selectBlock(block.dataset.blockId);
    }
  }

  function handleInput(event) {
    if (event.target.dataset.annotationResize !== undefined) {
      ns.annotations.resizeSelectedAnnotation(event.target.dataset.blockId, Number(event.target.value));
      return;
    }

    const coverField = event.target.dataset.coverField;
    if (coverField) {
      state.store.project.cover[coverField] = event.target.value;
      state.markDirty();
      ns.render.renderPreview();
      ns.render.renderMarkdown();
      ns.render.updateDirtyIndicator();
      return;
    }

    const stepField = event.target.dataset.stepField;
    if (stepField) {
      ns.blocks.updateCurrentStepField(stepField, event.target.value);
      return;
    }

    const blockField = event.target.dataset.blockField;
    if (blockField) {
      ns.blocks.updateBlockField(event.target.dataset.blockId, blockField, event.target.value);
    }
  }

  function handleChange(event) {
    if (event.target.id === "htmlFileInput") {
      ns.exporter.openStepImportModal(event.target.files[0]);
      event.target.value = "";
      return;
    }

    if (event.target.id === "htmlFileInput") {
      const file = event.target.files[0];
      const modeSelect = utils.$("htmlImportMode");
      const mode = modeSelect ? modeSelect.value : "main";
      ns.exporter.importViewerHtmlFile(file, mode);
      event.target.value = "";
      return;
    }

    if (event.target.dataset.action === "block-image-input") {
      ns.blocks.setBlockImageFromFile(event.target.dataset.blockId, event.target.files[0]);
      event.target.value = "";
      return;
    }

    if (event.target.id === "stepType") {
      ns.blocks.setStepType(event.target.value);
      return;
    }

    if (event.target.dataset.action === "move-block-step") {
      ns.blocks.moveBlockToStep(event.target.dataset.blockId, event.target.value);
      return;
    }

    if (event.target.id === "docLang") {
      changeDocLang(event.target.value);
    }
  }

  function handleDragStart(event) {
    const blockItem = event.target.closest("[data-sort-block-id]");
    if (blockItem) {
      draggedBlockId = blockItem.dataset.sortBlockId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedBlockId);
      return;
    }
    const stepItem = event.target.closest("[data-sort-step-id]");
    if (stepItem) {
      draggedStepId = stepItem.dataset.sortStepId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedStepId);
    }
  }

  function handleDragOver(event) {
    const dropzone = event.target.closest("[data-dropzone-block-id]");
    const sortItem = event.target.closest("[data-sort-block-id]");
    const stepItem = event.target.closest("[data-sort-step-id]");
    if (!dropzone && !sortItem && !stepItem) return;
    event.preventDefault();
    if (dropzone) dropzone.classList.add("dragover");
    if (sortItem && draggedBlockId) sortItem.classList.add("drag-over");
    if (stepItem && draggedStepId) stepItem.classList.add("drag-over");
  }

  function handleDragLeave(event) {
    const dropzone = event.target.closest("[data-dropzone-block-id]");
    const sortItem = event.target.closest("[data-sort-block-id]");
    const stepItem = event.target.closest("[data-sort-step-id]");
    if (dropzone) dropzone.classList.remove("dragover");
    if (sortItem) sortItem.classList.remove("drag-over");
    if (stepItem) stepItem.classList.remove("drag-over");
  }

  function handleDrop(event) {
    const dropzone = event.target.closest("[data-dropzone-block-id]");
    if (dropzone) {
      event.preventDefault();
      dropzone.classList.remove("dragover");
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      ns.blocks.setBlockImageFromFile(dropzone.dataset.dropzoneBlockId, file);
      return;
    }

    const sortItem = event.target.closest("[data-sort-block-id]");
    if (sortItem && draggedBlockId) {
      event.preventDefault();
      const rect = sortItem.getBoundingClientRect();
      const insertAfter = event.clientY > rect.top + rect.height / 2;
      ns.blocks.reorderBlock(draggedBlockId, sortItem.dataset.sortBlockId, insertAfter);
      clearSortDragClasses();
      draggedBlockId = null;
      return;
    }

    const stepItem = event.target.closest("[data-sort-step-id]");
    if (stepItem && draggedStepId) {
      event.preventDefault();
      const rect = stepItem.getBoundingClientRect();
      const insertAfter = event.clientY > rect.top + rect.height / 2;
      ns.blocks.reorderStep(draggedStepId, stepItem.dataset.sortStepId, insertAfter);
      clearStepDragClasses();
      draggedStepId = null;
    }
  }

  async function handlePaste(event) {
    const file = utils.firstImageFileFromClipboard(event);
    if (!file) return;
    event.preventDefault();
    await ns.blocks.pasteImage(file);
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && String(event.key).toLowerCase() === "s") {
      if (folderConnected()) {
        event.preventDefault();
        saveToFolder();
      }
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (ns.annotations.handleDeleteKey()) { event.preventDefault(); return; }
    }
    if (event.key === "Escape") {
      if (ns.annotations.handleEscape()) return;
      ns.annotations.closeAnnotationModal();
      ns.exporter.cancelStepImport();
      closePartPicker();
    }
  }

  function handleBeforeUnload(event) {
    if (!state.store.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  }

  function newProject() {
    if (state.store.dirty && !confirm(t("confirm.newProject"))) return;
    state.setProject(state.createProject());
    state.store.activeTab = "cover";
    ns.render.renderAll();
    utils.toast(t("toast.newProject"));
  }

  function toggleUiLang() {
    const next = ns.i18n.getUiLang() === "en" ? "ja" : "en";
    ns.i18n.setUiLang(next);
    ns.i18n.applyStaticTranslations();
    ns.render.renderAll();
    updateUiLangToggleLabel();
  }

  function changeDocLang(value) {
    const nextLang = value === "en" ? "en" : "ja";
    const project = state.store.project;
    const prevLang = project.docLang === "en" ? "en" : "ja";
    if (nextLang === prevLang) return;

    const jaDefaultTitle = ns.i18n.message("ja", "doc.defaultCoverTitle");
    const enDefaultTitle = ns.i18n.message("en", "doc.defaultCoverTitle");
    const currentTitle = project.cover.title || "";
    if (currentTitle === jaDefaultTitle || currentTitle === enDefaultTitle) {
      project.cover.title = ns.i18n.message(nextLang, "doc.defaultCoverTitle");
    }

    project.docLang = nextLang;
    state.markDirty();
    ns.render.renderAll();
  }

  function selectStep(stepId) {
    if (!state.setCurrentStep(stepId)) return;
    ns.render.renderStepList();
    ns.render.renderEditor();
    ns.render.renderPreview();
    ns.render.renderMarkdown();
  }

  function selectBlock(blockId) {
    if (!state.setCurrentBlock(blockId)) return;
    ns.render.renderStepList();
    ns.render.renderEditor();
    ns.render.renderSortList();
  }

  function clearSortDragClasses() {
    utils.$$("[data-sort-block-id]").forEach(function (item) {
      item.classList.remove("drag-over");
    });
  }

  function clearStepDragClasses() {
    utils.$$("[data-sort-step-id]").forEach(function (item) {
      item.classList.remove("drag-over");
    });
  }

  // ---- Folder / parts integration -------------------------------------------------
  let folderPanelOpen = false;
  const folderLists = { docs: [], parts: [], error: "" };

  function folderSupported() {
    return !!(ns.folder && typeof ns.folder.isSupported === "function" && ns.folder.isSupported());
  }

  function folderStatus() {
    return folderSupported() ? ns.folder.getState().status : "none";
  }

  function folderConnected() {
    return folderStatus() === "connected";
  }

  async function initFolder() {
    if (!folderSupported()) {
      renderFolderUi();
      return;
    }
    ns.folder.onChange(function () {
      renderFolderUi();
      if (folderConnected()) refreshFolderLists();
    });
    try {
      await ns.folder.init();
    } catch (error) { /* init never throws by contract */ }
    renderFolderUi();
    if (folderConnected()) refreshFolderLists();
  }

  function setHidden(id, hidden) {
    const node = utils.$(id);
    if (node) node.classList.toggle("hidden", hidden);
  }

  function renderFolderUi() {
    const supported = folderSupported();
    const connected = folderConnected();
    setHidden("folderToggle", !supported);
    setHidden("folderSave", !connected);
    setHidden("insertPartBtn", !connected || state.store.project.kind === "part");
    const panel = utils.$("folderPanel");
    if (!panel) return;
    panel.classList.toggle("hidden", !supported || !folderPanelOpen);
    if (!supported || !folderPanelOpen) return;

    const info = ns.folder.getState();
    const name = info.name || "";
    let html = '<div class="folder-bar">';
    if (info.status === "connected") {
      html += '<strong>' + utils.escapeHtml(t("folder.connectedTo", { name: name })) + '</strong>';
      html += '<button type="button" class="small secondary" data-action="folder-disconnect">' + utils.escapeHtml(t("folder.disconnect")) + '</button>';
      html += '<button type="button" class="small secondary" data-action="folder-refresh">' + utils.escapeHtml(t("folder.refresh")) + '</button>';
      html += '<button type="button" class="small" data-action="new-part">' + utils.escapeHtml(t("folder.newPart")) + '</button>';
      const path = ns.folder.getCurrentPath();
      html += '<span class="hint">' + utils.escapeHtml(path ? t("folder.current", { path: path }) : t("folder.currentNone")) + '</span>';
    } else if (info.status === "needs-permission") {
      html += '<span>' + utils.escapeHtml(t("folder.needsPermission", { name: name })) + '</span>';
      html += '<button type="button" class="small" data-action="folder-reconnect">' + utils.escapeHtml(t("folder.reconnect")) + '</button>';
      html += '<button type="button" class="small secondary" data-action="folder-disconnect">' + utils.escapeHtml(t("folder.disconnect")) + '</button>';
    } else {
      html += '<span class="hint">' + utils.escapeHtml(t("folder.none")) + '</span>';
      html += '<button type="button" class="small" data-action="folder-pick">' + utils.escapeHtml(t("folder.choose")) + '</button>';
    }
    html += '</div>';

    if (info.status === "connected") {
      if (folderLists.error) html += '<p class="part-missing-note">' + utils.escapeHtml(folderLists.error) + '</p>';
      function listHtml(items, kind, emptyKey) {
        if (!items.length) return '<p class="hint">' + utils.escapeHtml(t(emptyKey)) + '</p>';
        return '<ul class="folder-list">' + items.map(function (item) {
          return '<li><button type="button" class="folder-item" data-action="open-folder-file" data-kind="' + kind + '" data-path="' + utils.escapeAttribute(item.path) + '">' +
            utils.escapeHtml(kind === "part" ? "🧩 " + item.name : item.name) + '</button></li>';
        }).join("") + '</ul>';
      }
      html += '<div class="folder-lists">';
      html += '<div><h3>' + utils.escapeHtml(t("folder.docs")) + '</h3>' + listHtml(folderLists.docs, "doc", "folder.noDocs") + '</div>';
      html += '<div><h3>' + utils.escapeHtml(t("folder.parts")) + '</h3>' + listHtml(folderLists.parts, "part", "folder.noParts") + '</div>';
      html += '</div>';
    }
    panel.innerHTML = html;
  }

  async function refreshFolderLists() {
    if (!folderConnected()) {
      folderLists.docs = [];
      folderLists.parts = [];
      folderLists.error = "";
      renderFolderUi();
      return;
    }
    try {
      folderLists.docs = await ns.folder.listDocs();
      folderLists.parts = await ns.folder.listParts();
      folderLists.error = "";
    } catch (error) {
      folderLists.error = t("folder.listFailed") + (error && error.message ? error.message : "");
    }
    renderFolderUi();
  }

  async function folderPick() {
    try {
      const result = await ns.folder.pick();
      if (!result) return;
    } catch (error) {
      alert(t("folder.connectFailed") + (error && error.message ? error.message : ""));
      return;
    }
    renderFolderUi();
    ns.render.renderAll();
    await refreshFolderLists();
    syncRefsNow();
  }

  async function folderReconnect() {
    try {
      await ns.folder.reconnect();
    } catch (error) {
      alert(t("folder.connectFailed") + (error && error.message ? error.message : ""));
      return;
    }
    renderFolderUi();
    ns.render.renderAll();
    await refreshFolderLists();
    syncRefsNow();
  }

  async function folderDisconnect() {
    try {
      await ns.folder.disconnect();
    } catch (error) { /* ignore */ }
    folderLists.docs = [];
    folderLists.parts = [];
    ns.render.renderAll();
  }

  function showNotice(lines) {
    const box = utils.$("notice");
    if (!box) return;
    box.innerHTML = '<div class="notice-body">' + lines.map(function (line) {
      return '<div class="' + (line.cls || "") + '">' + utils.escapeHtml(line.text) + '</div>';
    }).join("") + '</div><button type="button" class="small secondary" data-action="close-notice">' + utils.escapeHtml(t("notice.close")) + '</button>';
    box.classList.remove("hidden");
  }

  function hideNotice() {
    const box = utils.$("notice");
    if (!box) return;
    box.classList.add("hidden");
    box.innerHTML = "";
  }

  // Bring ref steps of the open project up to date from the folder (decision 1 in the spec).
  async function syncRefsNow() {
    const project = state.store.project;
    if (!state.hasRefSteps(project) || !ns.parts || typeof ns.parts.syncRefs !== "function") return;
    try {
      const result = await ns.parts.syncRefs(project);
      if (project !== state.store.project) return;
      if (result && result.updated) state.markDirty();
      ns.render.renderAll();
      if (result && result.updated) utils.toast(t("parts.synced", { n: result.updated }));
      if (result && result.missing && result.missing.length) {
        utils.toast(t("parts.missingToast", { titles: result.missing.join(", ") }));
      }
    } catch (error) {
      utils.toast(t("parts.syncFailed") + (error && error.message ? error.message : ""));
    }
  }

  async function openFromFolder(path, kind) {
    if (!path || !folderConnected()) return;
    if (state.store.dirty && !confirm(t("confirm.discardForOpen"))) return;
    try {
      const text = await ns.folder.readText(path);
      const data = ns.exporter.parseEditorHtml(text);
      if (!data) {
        alert(t("alert.noEditorData"));
        return;
      }
      if (data.kind === "part" && state.hasRefSteps(data)) {
        alert(t("parts.nested"));
        return;
      }
      state.setProject(data);
      ns.folder.setCurrentPath(path);
      state.store.activeTab = kind === "part" ? "steps" : "cover";
      hideNotice();
      ns.render.renderAll();
      await syncRefsNow();
    } catch (error) {
      alert(t("folder.openFailed") + (error && error.message ? error.message : ""));
    }
  }

  async function saveToFolder() {
    if (!folderConnected()) return;
    const project = state.store.project;
    const isPart = project.kind === "part";
    try {
      let path = ns.folder.getCurrentPath();
      if (!path) {
        const base = utils.sanitizeFileName(project.cover.title, ns.i18n.tDoc("doc.fileFallbackName"));
        path = await ns.folder.uniquePath(isPart ? "_parts" : "", base);
      }
      await ns.folder.writeText(path, ns.viewerExport.buildViewerHtml(project));
      ns.folder.setCurrentPath(path);
      state.markClean();
      ns.render.updateDirtyIndicator();
      utils.toast(t("folder.saved", { path: path }));
      renderFolderUi();
      refreshFolderLists();
      if (isPart && ns.parts && typeof ns.parts.republish === "function") {
        const result = await ns.parts.republish(project);
        const lines = [{ text: t("parts.republished", { n: (result.updated || []).length }) }];
        (result.updated || []).forEach(function (name) { lines.push({ text: "  " + name, cls: "notice-item" }); });
        if (result.failed && result.failed.length) {
          lines.push({ text: t("parts.republishFailed"), cls: "notice-error" });
          result.failed.forEach(function (item) {
            lines.push({ text: "  " + item.name + (item.message ? " (" + item.message + ")" : ""), cls: "notice-error" });
          });
        }
        showNotice(lines);
      }
    } catch (error) {
      alert(t("folder.saveFailed") + (error && error.message ? error.message : ""));
    }
  }

  function newPart() {
    if (state.store.dirty && !confirm(t("confirm.discardForOpen"))) return;
    const project = state.createProject();
    project.kind = "part";
    project.partId = utils.uid("part");
    project.cover.title = ns.i18n.message(project.docLang, "parts.defaultTitle");
    state.setProject(project);
    state.store.activeTab = "cover";
    hideNotice();
    ns.render.renderAll();
  }

  async function showPartPicker() {
    if (!folderConnected()) return;
    const modal = utils.$("partPickerModal");
    const list = utils.$("partPickerList");
    if (!modal || !list) return;
    let parts = [];
    try {
      parts = await ns.folder.listParts();
    } catch (error) {
      alert(t("folder.listFailed") + (error && error.message ? error.message : ""));
      return;
    }
    list.innerHTML = parts.length
      ? parts.map(function (item) {
          return '<li><button type="button" class="folder-item" data-action="pick-part" data-path="' + utils.escapeAttribute(item.path) + '">🧩 ' + utils.escapeHtml(item.name) + '</button></li>';
        }).join("")
      : '<li class="hint">' + utils.escapeHtml(t("parts.pickEmpty")) + '</li>';
    modal.hidden = false;
  }

  function closePartPicker() {
    const modal = utils.$("partPickerModal");
    if (modal) modal.hidden = true;
  }

  async function insertPart(path) {
    if (!path || !ns.parts || typeof ns.parts.createRefStep !== "function") return;
    try {
      const text = await ns.folder.readText(path);
      const raw = ns.exporter.parseEditorHtml(text);
      if (!raw || raw.kind !== "part") {
        alert(t("parts.notAPart"));
        return;
      }
      if (state.hasRefSteps(raw)) {
        alert(t("parts.nested"));
        return;
      }
      const part = state.normalizeProject(raw);
      const refStep = ns.parts.createRefStep(part, path);
      const steps = state.store.project.steps;
      const current = state.findStepById(state.store.currentStepId);
      let index;
      if (current && current.step.type === "normal") {
        index = current.stepIndex + 1;
      } else {
        index = steps.findIndex(function (s) { return s.type !== "normal"; });
        if (index === -1) index = steps.length;
      }
      steps.splice(index, 0, refStep);
      state.store.project.version = 3;
      state.store.currentStepId = refStep.id;
      state.store.currentBlockId = null;
      state.store.selectedAnnotationId = null;
      state.markDirty();
      closePartPicker();
      ns.render.showTab("steps");
      ns.render.renderAll();
      utils.toast(t("parts.inserted"));
    } catch (error) {
      alert(t("folder.openFailed") + (error && error.message ? error.message : ""));
    }
  }

  function removeRef(stepId) {
    const found = state.findStepById(stepId);
    if (!found || !found.step.ref) return;
    if (!confirm(t("confirm.removeRef"))) return;
    const steps = state.store.project.steps;
    steps.splice(found.stepIndex, 1);
    if (!state.hasRefSteps(state.store.project)) state.store.project.version = 2;
    const next = steps[Math.max(0, found.stepIndex - 1)] || steps[0] || null;
    state.store.currentStepId = next ? next.id : null;
    state.store.currentBlockId = next && next.blocks[0] ? next.blocks[0].id : null;
    state.store.selectedAnnotationId = null;
    state.markDirty();
    ns.render.renderAll();
  }

  ns.app = {
    renderFolderUi,
    refreshFolderLists,
    syncRefsNow,
    saveToFolder,
    openFromFolder,
    showNotice
  };
})(window.ProcedureEditor = window.ProcedureEditor || {});
