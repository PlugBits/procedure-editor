(function (ns) {
  "use strict";

  const utils = ns.utils;
  const state = ns.state;
  const t = function (key, vars) { return ns.i18n.t(key, vars); };
  const tDoc = function (key, vars) { return ns.i18n.tDoc(key, vars); };

  function renderAll() {
    renderCover();
    renderStepList();
    renderEditor();
    renderSortList();
    renderPreview();
    renderMarkdown();
    updateDirtyIndicator();
    syncTabVisibility();
  }

  function renderCover() {
    const cover = state.store.project.cover;
    utils.$$("[data-cover-field]").forEach(function (field) {
      const key = field.dataset.coverField;
      field.value = cover[key] || "";
    });
    const docLangSelect = utils.$("docLang");
    if (docLangSelect) docLangSelect.value = state.store.project.docLang === "en" ? "en" : "ja";
  }

  function renderStepList() {
    const box = utils.$("stepList");
    const steps = state.store.project.steps;
    if (!steps.length) {
      box.innerHTML = '<div class="empty-state">' + utils.escapeHtml(t("steps.emptyList")) + '</div>';
      return;
    }

    const normalSteps    = steps.filter(function (s) { return s.type === "normal"; });
    const irregularSteps = steps.filter(function (s) { return s.type === "irregular"; });
    const errorSteps     = steps.filter(function (s) { return s.type === "error"; });

    function stepItemHtml(step, badgeText, badgeClass, extraClass) {
      const active = step.id === state.store.currentStepId ? " active" : "";
      return [
        '<div class="step-item' + extraClass + active + '" draggable="true" data-sort-step-id="' + utils.escapeAttribute(step.id) + '">',
        '<span class="step-drag-handle no-print" aria-hidden="true">↕</span>',
        '<button type="button" class="step-item-body" data-action="select-step" data-step-id="' + utils.escapeAttribute(step.id) + '">',
        '<span class="step-line">',
        '<span class="' + badgeClass + '">' + utils.escapeHtml(badgeText) + '</span>',
        '<span class="step-title">' + utils.escapeHtml(step.title || t("ui.untitled")) + '</span>',
        '</span>',
        '<span class="step-meta">' + utils.escapeHtml(step.screen || t("ui.noScreenName")) + " / " + utils.escapeHtml(t("ui.blockCount", { n: (step.blocks || []).length })) + "</span>",
        '</button>',
        '<button type="button" class="step-item-delete no-print" data-action="delete-step" data-step-id="' + utils.escapeAttribute(step.id) + '" title="' + utils.escapeAttribute(t("ui.deleteStepTitle")) + '">×</button>',
        '</div>'
      ].join("");
    }

    let html = normalSteps.map(function (step, i) {
      return stepItemHtml(step, t("ui.badgeStep", { n: i + 1 }), "badge", "");
    }).join("");

    if (!normalSteps.length) {
      html += '<div class="empty-state">' + utils.escapeHtml(t("steps.emptyNormalList")) + '</div>';
    }

    if (irregularSteps.length) {
      html += '<div class="step-list-divider step-list-divider-irregular"><span>' + utils.escapeHtml(t("ui.dividerIrregular")) + '</span></div>';
      html += irregularSteps.map(function (step, i) {
        return stepItemHtml(step, t("ui.badgeIrregular", { n: i + 1 }), "badge badge-irregular", " step-item-irregular");
      }).join("");
    }

    if (errorSteps.length) {
      html += '<div class="step-list-divider"><span>' + utils.escapeHtml(t("ui.dividerError")) + '</span></div>';
      html += errorSteps.map(function (step, i) {
        return stepItemHtml(step, t("ui.badgeError", { n: i + 1 }), "badge badge-error", " step-item-error");
      }).join("");
    }

    box.innerHTML = html;
  }

  function renderEditor() {
    const step = state.getCurrentStep();
    const noStep = utils.$("noStep");
    const editor = utils.$("stepEditor");
    noStep.classList.toggle("hidden", !!step);
    editor.classList.toggle("hidden", !step);
    if (!step) {
      utils.$("blockList").innerHTML = "";
      renderSortList();
      return;
    }

    utils.$("stepTitle").value = step.title || "";
    utils.$("screenName").value = step.screen || "";
    utils.$("stepSummary").value = step.summary || "";
    utils.$("stepCheck").value = step.check || "";
    const typeSelect = utils.$("stepType");
    if (typeSelect) typeSelect.value = step.type || "normal";

    renderBlocks();
    renderSortList();
  }

  function renderBlocks() {
    const step = state.getCurrentStep();
    const box = utils.$("blockList");
    if (!step) {
      box.innerHTML = "";
      return;
    }
    step.blocks = step.blocks || [];
    if (!step.blocks.length) {
      box.innerHTML = '<div class="empty-state">' + utils.escapeHtml(t("blocks.emptyList")) + '</div>';
      return;
    }
    const addBlockBtn = '<div class="block-add-bottom no-print"><button type="button" data-action="add-block">' + utils.escapeHtml(t("blocks.add")) + '</button></div>';
    box.innerHTML = step.blocks.map(function (block, index) {
      return blockCard(step, block, index);
    }).join("") + addBlockBtn;
  }

  function blockCard(step, block, index) {
    const active = block.id === state.store.currentBlockId ? " active" : "";
    const stepOptions = state.store.project.steps.map(function (targetStep, targetIndex) {
      return '<option value="' + utils.escapeAttribute(targetStep.id) + '"' + (targetStep.id === step.id ? " selected" : "") + '>STEP ' + (targetIndex + 1) + " " + utils.escapeHtml(targetStep.title || "") + "</option>";
    }).join("");

    return [
      '<article class="block' + active + '" data-block-id="' + utils.escapeAttribute(block.id) + '">',
      '<div class="block-head' + (step.type === "error" ? " block-head-error" : step.type === "irregular" ? " block-head-irregular" : "") + '">',
      '<strong>' + utils.escapeHtml(t("ui.blockLabel", { n: index + 1 })) + '</strong>',
      '<div class="block-tools no-print">',
      '<button type="button" class="small secondary" data-action="move-block" data-block-id="' + utils.escapeAttribute(block.id) + '" data-dir="-1">' + utils.escapeHtml(t("ui.moveUp")) + '</button>',
      '<button type="button" class="small secondary" data-action="move-block" data-block-id="' + utils.escapeAttribute(block.id) + '" data-dir="1">' + utils.escapeHtml(t("ui.moveDown")) + '</button>',
      '<button type="button" class="small danger" data-action="delete-block" data-block-id="' + utils.escapeAttribute(block.id) + '">' + utils.escapeHtml(t("ui.delete")) + '</button>',
      '</div>',
      '</div>',
      '<div class="block-body">',
      '<div class="block-grid">',
      '<div>',
      '<label class="field"><span>' + utils.escapeHtml(t("fields.heading")) + '</span><input type="text" value="' + utils.escapeAttribute(block.title || "") + '" data-block-field="title" data-block-id="' + utils.escapeAttribute(block.id) + '"></label>',
      '<div class="field">',
      '<div class="field-label-row"><span>' + utils.escapeHtml(t("fields.description")) + '</span><button type="button" class="small secondary" data-action="insert-block-link" data-block-id="' + utils.escapeAttribute(block.id) + '">' + utils.escapeHtml(t("ui.insertLink")) + '</button></div>',
      '<textarea data-block-field="text" data-block-id="' + utils.escapeAttribute(block.id) + '">' + utils.escapeHtml(block.text || "") + '</textarea>',
      '</div>',
      '<label class="field no-print"><span>' + utils.escapeHtml(t("fields.parentStep")) + '</span><select data-action="move-block-step" data-block-id="' + utils.escapeAttribute(block.id) + '">' + stepOptions + '</select></label>',
      '</div>',
      '<div>',
      '<div class="field"><span>' + utils.escapeHtml(t("fields.screenshot")) + '</span>' + imageEditor(block) + '</div>',
      '</div>',
      '</div>',
      '</div>',
      step.type !== "error" ? blockJumpSection(block) : "",
      '</article>'
    ].join("");
  }

  function blockJumpSection(block) {
    const nonNormalSteps = state.store.project.steps.filter(function (s) { return s.type !== "normal"; });
    const jumps = block.jumps || [];
    const internalJumpedIds = jumps.filter(function (j) { return j.targetStepId; }).map(function (j) { return j.targetStepId; });

    const stepNums = {};
    let ec = 0, ic = 0;
    state.store.project.steps.forEach(function (s) {
      if (s.type === "error") { ec += 1; stepNums[s.id] = { label: t("ui.badgeError", { n: ec }), type: "error" }; }
      else if (s.type === "irregular") { ic += 1; stepNums[s.id] = { label: t("ui.badgeIrregular", { n: ic }), type: "irregular" }; }
    });

    const available = nonNormalSteps.filter(function (s) { return !internalJumpedIds.includes(s.id); });

    const jumpTags = jumps.map(function (jump) {
      if (jump.url) return "";
      const info = stepNums[jump.targetStepId] || { label: "?", type: "error" };
      const isIrregular = info.type === "irregular";
      const icon = isIrregular ? "↗" : "⚠";
      const tagClass = isIrregular ? "jump-tag jump-tag-irregular" : "jump-tag";
      return [
        '<span class="' + tagClass + '">',
        '<span class="jump-icon">' + icon + '</span>',
        '<span class="jump-tag-text">' + info.label + ': ' + utils.escapeHtml(jump.label || "") + '</span>',
        '<button type="button" class="jump-tag-remove" data-action="delete-block-jump"',
        ' data-block-id="' + utils.escapeAttribute(block.id) + '"',
        ' data-jump-id="' + utils.escapeAttribute(jump.id) + '">×</button>',
        '</span>'
      ].join("");
    }).join("");

    let internalAddHtml;
    if (nonNormalSteps.length === 0) {
      internalAddHtml = '<span class="jump-hint">' + utils.escapeHtml(t("ui.noJumpTargets")) + '</span>';
    } else if (available.length === 0) {
      internalAddHtml = '<span class="jump-hint">' + utils.escapeHtml(t("ui.allJumpTargetsAdded")) + '</span>';
    } else {
      const options = ['<option value="">' + utils.escapeHtml(t("ui.selectPlaceholder")) + '</option>'].concat(
        available.map(function (s) {
          const info = stepNums[s.id] || { label: s.title || "?", type: s.type };
          return '<option value="' + utils.escapeAttribute(s.id) + '">' + info.label + ': ' + utils.escapeHtml(s.title || "") + '</option>';
        })
      ).join("");
      internalAddHtml = [
        '<select class="jump-select" data-jump-step-select data-block-id="' + utils.escapeAttribute(block.id) + '">' + options + '</select>',
        '<button type="button" class="small secondary" data-action="add-block-jump" data-block-id="' + utils.escapeAttribute(block.id) + '">' + utils.escapeHtml(t("ui.add")) + '</button>'
      ].join("");
    }

    return [
      '<div class="block-jump-section no-print">',
      '<div class="block-jump-row">',
      '<span class="block-jump-label">' + utils.escapeHtml(t("ui.jumpLabel")) + '</span>',
      internalAddHtml,
      '</div>',
      jumps.length ? '<div class="block-jump-list">' + jumpTags + '</div>' : '',
      '</div>'
    ].join("");
  }

  function imageEditor(block) {
    if (!block.image) {
      return [
        '<label class="dropzone" data-dropzone-block-id="' + utils.escapeAttribute(block.id) + '">',
        t("ui.dropImage"),
        '<input type="file" accept="image/*" data-action="block-image-input" data-block-id="' + utils.escapeAttribute(block.id) + '">',
        '</label>'
      ].join("");
    }

    return [
      ns.annotations.imageMarkup(block, "editor"),
      '<div class="annotation-toolbar no-print">',
      '<button type="button" class="small secondary" data-action="open-annotation-modal" data-block-id="' + utils.escapeAttribute(block.id) + '">' + utils.escapeHtml(t("ui.editAnnotations")) + '</button>',
      '<span class="annotation-count">' + utils.escapeHtml(t("ui.annotationCount", { n: (block.annotations || []).length })) + '</span>',
      '</div>',
      '<div class="image-actions no-print">',
      '<span class="image-name">' + utils.escapeHtml(block.imageName || t("ui.imageFallback")) + '</span>',
      '<div class="block-tools">',
      '<label class="button small secondary file-button">' + utils.escapeHtml(t("ui.changeImage")) + '<input type="file" accept="image/*" data-action="block-image-input" data-block-id="' + utils.escapeAttribute(block.id) + '"></label>',
      '<button type="button" class="small danger" data-action="clear-block-image" data-block-id="' + utils.escapeAttribute(block.id) + '">' + utils.escapeHtml(t("ui.deleteImage")) + '</button>',
      '</div>',
      '</div>'
    ].join("");
  }

  function renderSortList() {
    const box = utils.$("sortList");
    const step = state.getCurrentStep();
    if (!step) {
      box.innerHTML = '<div class="empty-state">' + utils.escapeHtml(t("ui.selectStepHint")) + '</div>';
      return;
    }
    if (!step.blocks || !step.blocks.length) {
      box.innerHTML = '<div class="empty-state">' + utils.escapeHtml(t("ui.noBlocksToSort")) + '</div>';
      return;
    }
    box.innerHTML = step.blocks.map(function (block, index) {
      const active = block.id === state.store.currentBlockId ? " active" : "";
      return [
        '<div class="sort-item' + active + '" draggable="true" data-sort-block-id="' + utils.escapeAttribute(block.id) + '">',
        '<div class="sort-line">',
        '<span class="drag-handle" aria-hidden="true">↕</span>',
        '<span class="badge">' + (index + 1) + '</span>',
        '<span class="sort-title">' + utils.escapeHtml(block.title || t("ui.untitled")) + '</span>',
        '</div>',
        '</div>'
      ].join("");
    }).join("");
  }

  function renderPreview() {
    const cover = state.store.project.cover;
    const allSteps = state.store.project.steps;
    const normalSteps    = allSteps.filter(function (s) { return s.type === "normal"; });
    const irregularSteps = allSteps.filter(function (s) { return s.type === "irregular"; });
    const errorSteps     = allSteps.filter(function (s) { return s.type === "error"; });

    const stepNums = {};
    normalSteps.forEach(function (s, i) { stepNums[s.id] = { label: tDoc("doc.badgeStep", { n: i + 1 }), num: i + 1, type: "normal" }; });
    irregularSteps.forEach(function (s, i) { stepNums[s.id] = { label: tDoc("doc.badgeIrregular", { n: i + 1 }), num: "N" + (i + 1), type: "irregular" }; });
    errorSteps.forEach(function (s, i) { stepNums[s.id] = { label: tDoc("doc.badgeError", { n: i + 1 }), num: "E" + (i + 1), type: "error" }; });

    const rows = ns.exporter.coverRows(cover).map(function (row) {
      return '<tr><th>' + utils.escapeHtml(row[0]) + '</th><td>' + utils.textToHtml(row[1] || "") + '</td></tr>';
    }).join("");
    let html = '<h1>' + utils.escapeHtml(cover.title || tDoc("doc.defaultCoverTitle")) + '</h1>';
    html += '<table class="cover-table">' + rows + '</table>';
    ns.exporter.coverSections(cover).forEach(function (section) {
      if (!section[2]) return;
      const highlight = section[0] === "notes" ? ' class="preview-callout preview-callout-warning"' : "";
      html += '<section' + highlight + '><h2>' + utils.escapeHtml(section[1]) + '</h2><p>' + utils.textToHtml(section[2]) + '</p></section>';
    });
    html += '<div style="page-break-before:always"></div><h2>' + utils.escapeHtml(tDoc("doc.section.procedureSteps")) + '</h2>';
    if (!normalSteps.length && !irregularSteps.length && !errorSteps.length) {
      html += '<p class="empty-state">' + utils.escapeHtml(tDoc("doc.stepsEmpty")) + '</p>';
    }
    normalSteps.forEach(function (step, i) {
      html += previewStepHtml(step, tDoc("doc.badgeStep", { n: i + 1 }), i + 1, "normal", stepNums);
    });
    if (irregularSteps.length) {
      html += '<div class="preview-irregular-divider" style="page-break-before:always"><h2>' + utils.escapeHtml(tDoc("doc.section.irregularSteps")) + '</h2></div>';
      irregularSteps.forEach(function (step, i) {
        html += previewStepHtml(step, tDoc("doc.badgeIrregular", { n: i + 1 }), "N" + (i + 1), "irregular", stepNums);
      });
    }
    if (errorSteps.length) {
      html += '<div class="preview-error-divider" style="page-break-before:always"><h2>' + utils.escapeHtml(tDoc("doc.section.errorSteps")) + '</h2></div>';
      errorSteps.forEach(function (step, i) {
        html += previewStepHtml(step, tDoc("doc.badgeError", { n: i + 1 }), "E" + (i + 1), "error", stepNums);
      });
    }
    utils.$("previewArea").innerHTML = html;
  }

  function previewStepHtml(step, label, stepNum, stepType, stepNums) {
    const typeClass = stepType === "error" ? " preview-step-error" : stepType === "irregular" ? " preview-step-irregular" : "";
    let html = '<section class="preview-step' + typeClass + '" id="step-' + utils.escapeAttribute(step.id) + '">';
    html += '<h3>' + utils.escapeHtml(label) + ' ' + utils.escapeHtml(step.title || "") + '</h3>';
    if (step.screen) html += '<p><strong>' + utils.escapeHtml(tDoc("doc.screenNameLabel")) + '</strong> ' + utils.escapeHtml(step.screen) + '</p>';
    if (step.summary) html += '<p>' + utils.textToHtml(step.summary) + '</p>';
    if (step.check) html += '<aside class="preview-callout preview-callout-warning"><h4>' + utils.escapeHtml(tDoc("doc.checkPoints")) + '</h4><p>' + utils.textToHtml(step.check) + '</p></aside>';
    (step.blocks || []).forEach(function (block, blockIndex) {
      html += '<div class="preview-block">';
      html += '<h4>' + stepNum + '.' + (blockIndex + 1) + ' ' + utils.escapeHtml(block.title || "") + '</h4>';
      if (block.text) html += '<p>' + utils.textToHtml(block.text) + '</p>';
      if ((block.jumps || []).length) {
        html += '<div class="preview-jump-row">';
        block.jumps.forEach(function (jump) {
          if (jump.url) return;
          const info = stepNums[jump.targetStepId] || { label: "?", type: "error" };
          const isIrregular = info.type === "irregular";
          const btnClass = isIrregular ? " preview-jump-button-irregular" : "";
          const icon = isIrregular ? "↗" : "⚠";
          html += '<a href="#step-' + utils.escapeAttribute(jump.targetStepId) + '" class="preview-jump-button' + btnClass + '">' + icon + ' ' + info.label + ': ' + utils.escapeHtml(jump.label || "") + '</a>';
        });
        html += '</div>';
      }
      if (block.image) html += '<div class="preview-block-image">' + ns.annotations.imageMarkup(block, "preview") + '</div>';
      html += '</div>';
    });
    html += '</section>';
    return html;
  }

  function renderMarkdown() {
    const output = utils.$("markdownOutput");
    output.value = ns.exporter.generateMarkdown();
  }

  function showTab(name) {
    if (!["cover", "steps", "preview", "markdown"].includes(name)) return;
    state.store.activeTab = name;
    syncTabVisibility();
    if (name === "preview") renderPreview();
    if (name === "markdown") renderMarkdown();
  }

  function syncTabVisibility() {
    const active = state.store.activeTab;
    utils.$$("[data-tab]").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.tab === active);
    });
    ["cover", "steps", "preview", "markdown"].forEach(function (name) {
      const panel = utils.$(name + "Tab");
      if (panel) panel.classList.toggle("hidden", name !== active);
    });
  }

  function updateDirtyIndicator() {
    const node = utils.$("dirtyState");
    if (!node) return;
    node.textContent = state.store.dirty ? t("ui.unsaved") : t("ui.saved");
    node.classList.toggle("dirty", state.store.dirty);
  }

  ns.render = {
    renderAll,
    renderCover,
    renderStepList,
    renderEditor,
    renderBlocks,
    renderSortList,
    renderPreview,
    renderMarkdown,
    showTab,
    syncTabVisibility,
    updateDirtyIndicator
  };
})(window.ProcedureEditor = window.ProcedureEditor || {});
