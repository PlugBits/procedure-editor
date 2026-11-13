(function (ns) {
  "use strict";

  const utils = ns.utils;
  const state = ns.state;
  const t = function (key, vars) { return ns.i18n.t(key, vars); };

  const PIP_CSS = [
    "body{margin:0;padding:8px;font-family:sans-serif;background:#fff;color:#172033;display:flex;flex-direction:column;gap:6px;box-sizing:border-box;height:100vh}",
    ".row{display:flex;align-items:center;gap:8px}",
    "button{font:inherit;cursor:pointer;border:1px solid #2f6fed;border-radius:6px;background:#2f6fed;color:#fff;padding:6px 10px}",
    "button.secondary{background:#fff;color:#2f6fed}",
    "#take{flex:1;font-size:20px;font-weight:700;padding:10px;transition:background .15s}",
    "#take.flash{background:#1a9c5a;border-color:#1a9c5a}",
    ".count{font-weight:700;white-space:nowrap}",
    ".help{margin:0;font-size:10px;line-height:1.3;color:#5b6679}"
  ].join("\n");

  let session = null;

  function supported() {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function");
  }

  function makeUi(doc, withHelp) {
    const root = doc.createElement("div");
    root.className = "row";
    const take = doc.createElement("button");
    take.type = "button";
    take.id = "take";
    take.textContent = t("capture.take");
    const count = doc.createElement("span");
    count.className = "count";
    const stop = doc.createElement("button");
    stop.type = "button";
    stop.className = "secondary";
    stop.id = "stop";
    stop.textContent = t("capture.stop");
    root.appendChild(take);
    root.appendChild(count);
    root.appendChild(stop);
    take.addEventListener("click", function () { takeShot(); });
    stop.addEventListener("click", function () { stopCapture(); });
    return { root: root, take: take, count: count, stop: stop };
  }

  function helpNode(doc, text) {
    const p = doc.createElement("p");
    p.className = "help";
    p.textContent = text;
    return p;
  }

  function updateCount() {
    if (!session) return;
    const text = t("capture.count", { n: session.count });
    session.counters.forEach(function (node) { node.textContent = text; });
  }

  function flash() {
    if (!session) return;
    session.takeButtons.forEach(function (btn) {
      btn.classList.add("flash");
      setTimeout(function () { btn.classList.remove("flash"); }, 250);
    });
  }

  function waitForFrame(video) {
    return new Promise(function (resolve) {
      if (video.videoWidth > 0 && video.readyState >= 2) { resolve(true); return; }
      let done = false;
      function finish(ok) {
        if (done) return;
        done = true;
        video.removeEventListener("loadeddata", onData);
        resolve(ok);
      }
      function onData() { finish(video.videoWidth > 0); }
      video.addEventListener("loadeddata", onData);
      setTimeout(function () { finish(video.videoWidth > 0); }, 3000);
    });
  }

  function insertStep(step) {
    const steps = state.store.project.steps;
    const current = state.getCurrentStep();
    const currentIndex = current ? steps.indexOf(current) : -1;
    if (current && current.type === "normal" && currentIndex !== -1) {
      steps.splice(currentIndex + 1, 0, step);
      return;
    }
    const firstNonNormal = steps.findIndex(function (s) { return s.type !== "normal"; });
    if (firstNonNormal === -1) steps.push(step);
    else steps.splice(firstNonNormal, 0, step);
  }

  async function takeShot() {
    if (!session || session.busy) return;
    session.busy = true;
    try {
      const video = session.video;
      const ok = await waitForFrame(video);
      if (!session) return;
      if (!ok) { utils.toast(t("capture.noFrame")); return; }
      const canvas = document.createElement("canvas");
      // 長辺 1920 を超える時だけ縮める(それ以下は等倍・PNG のまま)
      const MAX_SIDE = 1920;
      const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");

      const normalCount = state.store.project.steps.filter(function (s) { return s.type === "normal"; }).length;
      const step = state.createStep(normalCount + 1);
      const block = step.blocks[0];
      session.count += 1;
      block.image = dataUrl;
      block.imageName = t("capture.screenName", { n: session.count });
      insertStep(step);
      state.store.currentStepId = step.id;
      state.store.currentBlockId = block.id;
      state.store.selectedAnnotationId = null;
      state.markDirty();
      ns.render.renderAll();
      updateCount();
      flash();
    } catch (error) {
      utils.toast(t("capture.noFrame"));
    } finally {
      if (session) session.busy = false;
    }
  }

  function onKey(event) {
    if (!session) return;
    if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && (event.code === "KeyS" || event.key === "S" || event.key === "s")) {
      event.preventDefault();
      takeShot();
    }
  }

  function removeBar() {
    const bar = document.getElementById("captureBar");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function buildBar() {
    removeBar();
    const ui = makeUi(document, true);
    const bar = document.createElement("div");
    bar.id = "captureBar";
    bar.className = "capture-bar no-print";
    ui.count.classList.add("capture-count");
    ui.take.className = "";
    bar.appendChild(ui.take);
    bar.appendChild(ui.count);
    bar.appendChild(ui.stop);
    bar.appendChild(helpNode(document, t("capture.noPip") + " " + t("capture.help")));
    const tab = document.getElementById("stepsTab");
    tab.insertBefore(bar, tab.firstChild);
    return ui;
  }

  function buildPip(pipWin) {
    const doc = pipWin.document;
    const style = doc.createElement("style");
    style.textContent = PIP_CSS;
    doc.head.appendChild(style);
    const ui = makeUi(doc, true);
    doc.body.appendChild(ui.root);
    doc.body.appendChild(helpNode(doc, t("capture.help")));
    return ui;
  }

  async function start() {
    if (session || !supported()) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    } catch (error) {
      if (!(error && error.name === "NotAllowedError")) utils.toast(t("capture.failed"));
      return;
    }
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(video);
    try { await video.play(); } catch (error) { /* frame wait handles it */ }

    session = { stream: stream, video: video, count: 0, busy: false, pip: null, counters: [], takeButtons: [] };
    stream.getTracks().forEach(function (track) {
      track.addEventListener("ended", function () { stopCapture(); });
    });

    let ui = null;
    if (window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === "function") {
      try {
        const pipWin = await window.documentPictureInPicture.requestWindow({ width: 240, height: 120 });
        if (!session) { try { pipWin.close(); } catch (e) { /* ignore */ } return; }
        session.pip = pipWin;
        ui = buildPip(pipWin);
        pipWin.addEventListener("pagehide", function () { if (session && session.pip === pipWin) { session.pip = null; stopCapture(); } });
      } catch (error) {
        ui = null;
      }
    }
    if (!session) return;
    if (!ui) ui = buildBar();
    session.counters.push(ui.count);
    session.takeButtons.push(ui.take);
    document.addEventListener("keydown", onKey);
    updateCount();
  }

  function stopCapture() {
    if (!session) return;
    const s = session;
    session = null;
    document.removeEventListener("keydown", onKey);
    s.stream.getTracks().forEach(function (track) { try { track.stop(); } catch (e) { /* ignore */ } });
    if (s.video.parentNode) s.video.parentNode.removeChild(s.video);
    s.video.srcObject = null;
    removeBar();
    if (s.pip) { try { s.pip.close(); } catch (e) { /* ignore */ } }
    utils.toast(t("capture.done", { n: s.count }));
  }

  function init() {
    const btn = document.getElementById("captureStartBtn");
    if (btn && supported()) btn.classList.remove("hidden");
    document.addEventListener("click", function (event) {
      const node = event.target.closest && event.target.closest("[data-action=\"start-capture\"]");
      if (node) start();
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  ns.capture = { start: start, stop: stopCapture, takeShot: takeShot, isActive: function () { return !!session; } };
})(window.ProcedureEditor = window.ProcedureEditor || {});
