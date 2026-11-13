(function (ns) {
  "use strict";

  // Reusable "parts": ref steps whose snapshot is expanded in place for all output.
  // ns.folder / ns.exporter / ns.viewerExport / ns.state are resolved lazily at call time.

  const DATA_MARKER = "PROCEDURE_EDITOR_DATA";
  const PARTS_DIR = "_parts";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    if (ns.utils && ns.utils.uid) return ns.utils.uid(prefix);
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function errMessage(error) {
    return (error && (error.message || error.code)) || String(error);
  }

  function isPart(project) {
    return !!(project && project.kind === "part");
  }

  function isRefStep(step) {
    return !!(step && step.ref);
  }

  function folderConnected() {
    const folder = ns.folder;
    if (!folder || typeof folder.getState !== "function") return false;
    const st = folder.getState();
    return !!(st && st.status === "connected");
  }

  function normalize(project) {
    if (ns.state && typeof ns.state.normalizeProject === "function") return ns.state.normalizeProject(project);
    return project;
  }

  function hasEditorData(text) {
    return typeof text === "string" && text.indexOf(DATA_MARKER) !== -1;
  }

  function stepsJson(steps) {
    return JSON.stringify(steps || []);
  }

  // Normalized steps of a part project, for comparison / snapshot use.
  function partSteps(partProject) {
    const normalized = normalize(partProject);
    return clone((normalized && normalized.steps) || []);
  }

  function snapshotSteps(ref) {
    return (ref && ref.snapshot && ref.snapshot.steps) || [];
  }

  // ---- expandProject -------------------------------------------------------

  function expandProject(project) {
    const copy = clone(project);
    const steps = Array.isArray(copy.steps) ? copy.steps : [];
    if (!steps.some(isRefStep)) return copy;

    // Pass 1: map ref step id -> first expanded step id.
    const refFirstId = {};
    steps.forEach(function (step) {
      if (!isRefStep(step)) return;
      const inner = snapshotSteps(step.ref);
      if (inner.length) refFirstId[step.id] = step.id + "__" + inner[0].id;
    });

    // Pass 2: build the expanded list.
    const out = [];
    steps.forEach(function (step) {
      if (!isRefStep(step)) {
        remapJumps(step, null, refFirstId);
        out.push(step);
        return;
      }
      const refId = step.id;
      const inner = clone(snapshotSteps(step.ref));
      const innerIds = {};
      inner.forEach(function (s) { innerIds[s.id] = true; });
      inner.forEach(function (s) {
        remapJumps(s, { prefix: refId + "__", ids: innerIds }, refFirstId);
        (s.blocks || []).forEach(function (b) { b.id = refId + "__" + b.id; });
        s.id = refId + "__" + s.id;
        s.fromPart = {
          refId: refId,
          partId: step.ref.partId,
          partTitle: step.ref.partTitle,
          missing: !!step.ref.missing
        };
        out.push(s);
      });
    });
    copy.steps = out;
    return copy;
  }

  // inside: {prefix, ids} when the step belongs to a part snapshot.
  function remapJumps(step, inside, refFirstId) {
    (step.blocks || []).forEach(function (block) {
      (block.jumps || []).forEach(function (jump) {
        const target = jump.targetStepId;
        if (inside && inside.ids[target]) {
          jump.targetStepId = inside.prefix + target;
        } else if (!inside && Object.prototype.hasOwnProperty.call(refFirstId, target)) {
          jump.targetStepId = refFirstId[target];
        }
      });
    });
  }

  // ---- createRefStep -------------------------------------------------------

  function createRefStep(partProject, path) {
    const title = (partProject.cover && partProject.cover.title) || "";
    return {
      id: uid("ref"),
      ref: {
        partId: partProject.partId,
        partTitle: title,
        file: path,
        snapshot: { steps: clone(partProject.steps || []) }
      },
      type: "normal",
      title: title,
      screen: "",
      summary: "",
      check: "",
      blocks: []
    };
  }

  // ---- index / scan --------------------------------------------------------

  async function parse(text) {
    return await ns.exporter.parseEditorHtml(text);
  }

  async function indexParts() {
    const index = new Map();
    const errors = [];
    let list;
    try {
      list = await ns.folder.listParts();
    } catch (error) {
      return { index: index, errors: [{ path: PARTS_DIR, message: errMessage(error) }] };
    }
    for (let i = 0; i < list.length; i++) {
      const path = list[i].path;
      try {
        const text = await ns.folder.readText(path);
        if (!hasEditorData(text)) throw new Error("no " + DATA_MARKER);
        const project = await parse(text);
        if (!project || project.kind !== "part" || !project.partId) throw new Error("not a part file");
        if ((project.steps || []).some(isRefStep)) throw new Error("part contains refs (nesting not allowed)");
        // First file wins on duplicate partId; report the duplicate.
        if (index.has(project.partId)) {
          errors.push({ path: path, message: "duplicate partId (also " + index.get(project.partId).path + ")" });
          continue;
        }
        index.set(project.partId, { path: path, project: project });
      } catch (error) {
        errors.push({ path: path, message: errMessage(error) });
      }
    }
    return { index: index, errors: errors };
  }

  // Applies the index to refs of `project` in place. Returns {updated, missing}.
  function applyIndex(project, index) {
    let updated = 0;
    const missing = [];
    (project.steps || []).forEach(function (step) {
      if (!isRefStep(step)) return;
      const ref = step.ref;
      const hit = index.get(ref.partId);
      if (!hit) {
        ref.missing = true;
        missing.push(ref.partTitle || step.title || ref.partId);
        return;
      }
      delete ref.missing;
      const fresh = partSteps(hit.project);
      const title = (hit.project.cover && hit.project.cover.title) || ref.partTitle;
      let changed = stepsJson(fresh) !== stepsJson(normalize({ steps: snapshotSteps(ref) }).steps);
      if (changed) ref.snapshot = { steps: fresh };
      if (ref.partTitle !== title) { ref.partTitle = title; step.title = title; changed = true; }
      if (ref.file !== hit.path) { ref.file = hit.path; changed = true; }
      if (changed) updated++;
    });
    return { updated: updated, missing: missing };
  }

  async function syncRefs(project) {
    if (!folderConnected()) return { updated: 0, missing: [], offline: true };
    const hasRefs = (project.steps || []).some(isRefStep);
    if (!hasRefs) return { updated: 0, missing: [] };
    const scanned = await indexParts();
    const result = applyIndex(project, scanned.index);
    if (scanned.errors.length) result.errors = scanned.errors;
    return result;
  }

  async function scanDocs(visit) {
    const docs = await ns.folder.listDocs();
    const report = { scanned: docs.length };
    for (let i = 0; i < docs.length; i++) await visit(docs[i]);
    return report;
  }

  async function partUsage(partId) {
    const names = [];
    await scanDocs(async function (doc) {
      try {
        const text = await ns.folder.readText(doc.path);
        if (!hasEditorData(text)) return;
        const project = await parse(text);
        if ((project.steps || []).some(function (s) { return isRefStep(s) && s.ref.partId === partId; })) {
          names.push(doc.name);
        }
      } catch (error) {
        // unreadable docs cannot be counted
      }
    });
    return names;
  }

  async function republish(partProject) {
    const result = { updated: [], failed: [], scanned: 0 };
    let index;
    try {
      const scanned = await indexParts();
      index = scanned.index;
    } catch (error) {
      index = new Map();
    }
    // The just-saved part is authoritative regardless of what is on disk.
    index.set(partProject.partId, {
      path: (ns.folder.getCurrentPath && ns.folder.getCurrentPath()) || null,
      project: partProject
    });
    const savedPath = index.get(partProject.partId).path;

    let docs;
    try {
      docs = await ns.folder.listDocs();
    } catch (error) {
      result.failed.push({ name: "(" + PARTS_DIR + ")", message: errMessage(error) });
      return result;
    }
    result.scanned = docs.length;

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      try {
        const text = await ns.folder.readText(doc.path);
        if (!hasEditorData(text)) continue; // not an editor file
        const project = await parse(text);
        const refs = (project.steps || []).filter(isRefStep);
        if (!refs.some(function (s) { return s.ref.partId === partProject.partId; })) continue;
        // Keep the known path for other parts; for the saved part use the saved path if we have one.
        const local = new Map(index);
        const entry = local.get(partProject.partId);
        if (!savedPath) {
          const existing = refs.filter(function (s) { return s.ref.partId === partProject.partId; })[0];
          local.set(partProject.partId, { path: existing.ref.file, project: entry.project });
        }
        applyIndex(project, local);
        refs.forEach(function (s) { delete s.ref.missing; });
        const html = ns.viewerExport.buildViewerHtml(normalize(project));
        await ns.folder.writeText(doc.path, html);
        result.updated.push(doc.name);
      } catch (error) {
        result.failed.push({ name: doc.name, message: errMessage(error) });
      }
    }
    return result;
  }

  ns.parts = {
    isPart: isPart,
    isRefStep: isRefStep,
    expandProject: expandProject,
    createRefStep: createRefStep,
    indexParts: indexParts,
    syncRefs: syncRefs,
    republish: republish,
    partUsage: partUsage
  };
})(window.ProcedureEditor = window.ProcedureEditor || {});
