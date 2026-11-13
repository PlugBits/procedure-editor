(function (ns) {
  "use strict";

  const utils = ns.utils;
  const state = ns.state;
  const t = function (key, vars) { return ns.i18n.t(key, vars); };
  const tDoc = function (key, vars) { return ns.i18n.tDoc(key, vars); };

  function coverRows(cover) {
    return [
      [tDoc("doc.cover.targetWork"), cover.targetWork],
      [tDoc("doc.cover.audience"), cover.audience],
      [tDoc("doc.cover.systemName"), cover.systemName],
      [tDoc("doc.cover.account"), cover.account],
      [tDoc("doc.cover.revision"), cover.revision],
      [tDoc("doc.cover.createdAt"), cover.createdAt],
      [tDoc("doc.cover.updatedAt"), cover.updatedAt],
      [tDoc("doc.cover.author"), cover.author],
      [tDoc("doc.cover.approver"), cover.approver]
    ];
  }

  function coverSections(cover) {
    return [
      ["purpose", tDoc("doc.cover.purpose"), cover.purpose],
      ["preparation", tDoc("doc.cover.preparation"), cover.preparation],
      ["notes", tDoc("doc.cover.notes"), cover.notes]
    ];
  }

  // Parse a viewer/part HTML text into project data with images restored.
  // Returns null when the text has no PROCEDURE_EDITOR_DATA comment; throws on broken JSON.
  function parseEditorHtml(text) {
    const match = String(text || "").match(/<!--\s*PROCEDURE_EDITOR_DATA:([\s\S]*?)-->/);
    if (!match) return null;
    const data = JSON.parse(match[1].trim());
    const doc = new DOMParser().parseFromString(text, "text/html");
    function restore(blockId, block) {
      if (block.image !== "__IMG__") return;
      const imgEl = doc.querySelector('.annotated-image[data-block-id="' + blockId + '"] img');
      block.image = imgEl ? imgEl.getAttribute("src") : null;
    }
    (data.steps || []).forEach(function (step) {
      (step.blocks || []).forEach(function (block) {
        restore(block.id, block);
      });
      if (step.ref && step.ref.snapshot) {
        (step.ref.snapshot.steps || []).forEach(function (inner) {
          (inner.blocks || []).forEach(function (block) {
            restore(step.id + "__" + block.id, block);
          });
        });
      }
    });
    return data;
  }

  function generateMarkdown() {
    const project = state.expandedProject(state.store.project);
    const cover = project.cover;
    let md = "# " + (cover.title || tDoc("doc.defaultCoverTitle")) + "\n\n";

    coverRows(cover).forEach(function (row) {
      md += "- **" + row[0] + "**: " + (row[1] || "") + "\n";
    });
    md += "\n";

    coverSections(cover).forEach(function (section) {
      if (!section[2]) return;
      md += "## " + section[1] + "\n\n" + section[2] + "\n\n";
    });

    md += "## " + tDoc("doc.section.procedureSteps") + "\n\n";
    const normalSteps    = project.steps.filter(function (s) { return s.type === "normal"; });
    const irregularSteps = project.steps.filter(function (s) { return s.type === "irregular"; });
    const errorSteps     = project.steps.filter(function (s) { return s.type === "error"; });

    function renderStepMd(step, label, stepNum) {
      md += "### " + label + ": " + (step.title || "") + "\n\n";
      if (step.screen) md += "**" + tDoc("doc.screenName") + "**: " + step.screen + "\n\n";
      if (step.summary) md += step.summary + "\n\n";
      if (step.check) md += "**" + tDoc("doc.checkPoints") + "**\n\n" + step.check + "\n\n";
      (step.blocks || []).forEach(function (block, blockIndex) {
        md += "#### " + stepNum + "." + (blockIndex + 1) + " " + (block.title || "") + "\n\n";
        if (block.text) md += block.text + "\n\n";
        if (block.image) md += "![" + (block.imageName || "screenshot") + "](" + block.image + ")\n\n";
        if ((block.annotations || []).length) md += "> " + tDoc("doc.annotationCount", { n: block.annotations.length }) + "\n\n";
        if ((block.jumps || []).length) {
          md += "> " + tDoc("doc.jumpSettings") + " " + block.jumps.map(function (j) { return j.label || j.targetStepId; }).join(", ") + "\n\n";
        }
      });
    }

    normalSteps.forEach(function (step, i) {
      renderStepMd(step, tDoc("doc.badgeStep", { n: i + 1 }), i + 1);
    });
    if (irregularSteps.length) {
      md += "## " + tDoc("doc.section.irregularSteps") + "\n\n";
      irregularSteps.forEach(function (step, i) {
        renderStepMd(step, tDoc("doc.badgeIrregular", { n: i + 1 }), "N" + (i + 1));
      });
    }
    if (errorSteps.length) {
      md += "## " + tDoc("doc.section.errorSteps") + "\n\n";
      errorSteps.forEach(function (step, i) {
        renderStepMd(step, tDoc("doc.badgeError", { n: i + 1 }), "E" + (i + 1));
      });
    }

    return md;
  }

  function exportJson() {
    const project = state.store.project;
    const baseName = utils.sanitizeFileName(project.cover.title, tDoc("doc.fileFallbackName"));
    const fileName = baseName + "_" + utils.timestamp() + ".json";
    utils.downloadText(fileName, JSON.stringify(project, null, 2), "application/json;charset=utf-8");
    state.markClean();
    ns.render.updateDirtyIndicator();
    utils.toast(t("toast.jsonSaved"));
  }

  function afterLoad() {
    if (ns.app && typeof ns.app.syncRefsNow === "function") ns.app.syncRefsNow();
  }

  async function importJsonFile(file) {
    if (!file) return;
    try {
      const text = await utils.readFileAsText(file);
      const data = JSON.parse(text);
      state.setProject(data);
      ns.render.renderAll();
      utils.toast(t("toast.jsonLoaded"));
      afterLoad();
    } catch (error) {
      alert(t("alert.jsonLoadFailed") + error.message);
    }
  }

  async function importHtmlFile(file) {
    if (!file) return;
    try {
      const text = await utils.readFileAsText(file);
      const data = parseEditorHtml(text);
      if (!data) {
        alert(t("alert.noEditorData"));
        return;
      }
      state.setProject(data);
      ns.render.renderAll();
      utils.toast(t("toast.viewerHtmlLoaded"));
      afterLoad();
    } catch (error) {
      alert(t("alert.viewerHtmlLoadFailed") + error.message);
    }
  }

  function downloadMarkdown() {
    const project = state.store.project;
    const baseName = utils.sanitizeFileName(project.cover.title, tDoc("doc.fileFallbackName"));
    utils.downloadText(baseName + "_" + utils.timestamp() + ".md", generateMarkdown(), "text/markdown;charset=utf-8");
    utils.toast(t("toast.markdownSaved"));
  }

  async function copyMarkdown() {
    const markdown = generateMarkdown();
    try {
      await navigator.clipboard.writeText(markdown);
      utils.toast(t("toast.markdownCopied"));
    } catch (error) {
      const output = utils.$("markdownOutput");
      output.value = markdown;
      output.focus();
      output.select();
      document.execCommand("copy");
      utils.toast(t("toast.markdownCopied"));
    }
  }

  let pendingImportSteps = null;
  let pendingImportData = null;

  async function openStepImportModal(file) {
    if (!file) return;
    try {
      const text = await utils.readFileAsText(file);
      const data = parseEditorHtml(text);
      if (!data) {
        alert(t("alert.noEditorData"));
        return;
      }
      pendingImportData = data;
      pendingImportSteps = data.steps || [];
      if (!pendingImportSteps.length) {
        utils.toast(t("toast.noStepsToImport"));
        return;
      }
      showStepImportModal(pendingImportSteps);
    } catch (error) {
      alert(t("alert.viewerHtmlLoadFailed") + error.message);
    }
  }

  function showStepImportModal(steps) {
    const modal = document.getElementById("stepImportModal");
    const list = document.getElementById("stepImportList");
    const selectAll = document.getElementById("stepImportSelectAll");
    if (!modal || !list || !selectAll) return;

    const typeLabel = { normal: t("import.type.normal"), irregular: t("import.type.irregular"), error: t("import.type.error") };
    const typeClass = { normal: "", irregular: "badge-irregular", error: "badge-error" };

    list.innerHTML = steps.map(function (step, i) {
      const type = step.type || "normal";
      const label = utils.escapeHtml(step.title || ("STEP " + (i + 1)));
      const badgeCls = "badge" + (typeClass[type] ? " " + typeClass[type] : "");
      return '<li><label><input type="checkbox" class="step-import-cb" data-step-id="' +
        utils.escapeAttribute(step.id) + '" checked><span class="' + badgeCls + '">' +
        utils.escapeHtml(typeLabel[type] || type) + '</span><span class="step-import-title">' + label + '</span></label></li>';
    }).join("");

    selectAll.checked = true;
    selectAll.indeterminate = false;

    selectAll.onchange = function () {
      list.querySelectorAll(".step-import-cb").forEach(function (cb) {
        cb.checked = selectAll.checked;
      });
    };

    list.onchange = function () {
      const all = list.querySelectorAll(".step-import-cb");
      const checked = list.querySelectorAll(".step-import-cb:checked");
      if (checked.length === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
      } else if (checked.length === all.length) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
      } else {
        selectAll.indeterminate = true;
      }
    };

    modal.hidden = false;
  }

  function confirmStepImport() {
    if (!pendingImportSteps) return;
    const list = document.getElementById("stepImportList");
    if (!list) return;

    const checkedIds = Array.from(list.querySelectorAll(".step-import-cb:checked")).map(function (cb) {
      return cb.dataset.stepId;
    });
    if (!checkedIds.length) {
      utils.toast(t("toast.noStepsSelected"));
      return;
    }

    const selected = pendingImportSteps.filter(function (s) { return checkedIds.includes(s.id); });

    const stepIdMap = {};
    selected.forEach(function (s) { stepIdMap[s.id] = utils.uid(s.ref ? "ref" : "step"); });

    const remapped = selected.map(function (step) {
      return Object.assign({}, step, {
        id: stepIdMap[step.id],
        blocks: (step.blocks || []).map(function (block) {
          return Object.assign({}, block, {
            id: utils.uid("blk"),
            annotations: (block.annotations || []).map(function (a) {
              return Object.assign({}, a, { id: utils.uid("ann") });
            }),
            jumps: (block.jumps || []).map(function (j) {
              const nj = Object.assign({}, j, { id: utils.uid("jump") });
              if (nj.targetStepId && stepIdMap[nj.targetStepId]) {
                nj.targetStepId = stepIdMap[nj.targetStepId];
              }
              return nj;
            })
          });
        })
      });
    });

    const steps = state.store.project.steps;
    remapped.forEach(function (step) {
      if (step.type === "normal") {
        const idx = steps.findIndex(function (s) { return s.type !== "normal"; });
        if (idx === -1) steps.push(step); else steps.splice(idx, 0, step);
      } else if (step.type === "irregular") {
        const idx = steps.findIndex(function (s) { return s.type === "error"; });
        if (idx === -1) steps.push(step); else steps.splice(idx, 0, step);
      } else {
        steps.push(step);
      }
    });

    state.markDirty();
    ns.render.renderAll();
    cancelStepImport();
    utils.toast(t("toast.stepsImported", { n: remapped.length }));
  }

  function replaceAllImport() {
    if (!pendingImportData) return;
    if (state.store.dirty && !confirm(t("confirm.overwriteWithHtml"))) return;
    state.setProject(pendingImportData);
    ns.render.renderAll();
    cancelStepImport();
    utils.toast(t("toast.viewerHtmlLoaded"));
    afterLoad();
  }

  function cancelStepImport() {
    const modal = document.getElementById("stepImportModal");
    if (modal) modal.hidden = true;
    pendingImportSteps = null;
    pendingImportData = null;
  }

  function printDocument() {
    ns.render.showTab("preview");
    ns.render.renderPreview();
    setTimeout(function () {
      window.print();
    }, 50);
  }

  ns.exporter = {
    coverRows,
    coverSections,
    generateMarkdown,
    parseEditorHtml,
    exportJson,
    importJsonFile,
    importHtmlFile,
    openStepImportModal,
    confirmStepImport,
    replaceAllImport,
    cancelStepImport,
    downloadMarkdown,
    copyMarkdown,
    printDocument
  };
})(window.ProcedureEditor = window.ProcedureEditor || {});
