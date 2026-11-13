(function (ns) {
  "use strict";

  const DB_NAME = "procedure-editor";
  const STORE = "handles";
  const KEY = "root";
  const PARTS_DIR = "_parts";

  let root = null;
  let status = "none";
  let currentPath = null;
  const listeners = [];

  function fail(code, message) {
    const error = new Error(message || code);
    error.code = code;
    return error;
  }

  function isSupported() {
    return "showDirectoryPicker" in window;
  }

  function getState() {
    return { supported: isSupported(), status: status, name: root ? root.name : "" };
  }

  function setStatus(next, handle) {
    root = handle === undefined ? root : handle;
    status = next;
    const state = getState();
    listeners.slice().forEach(function (cb) {
      try { cb(state); } catch (error) { console.error(error); }
    });
  }

  function onChange(cb) {
    if (typeof cb === "function") listeners.push(cb);
  }

  // ---- IndexedDB -------------------------------------------------------
  function openDb() {
    return new Promise(function (resolve, reject) {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idb(mode, run) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(STORE, mode);
        const req = run(tx.objectStore(STORE));
        tx.oncomplete = function () { db.close(); resolve(req.result); };
        tx.onerror = tx.onabort = function () { db.close(); reject(tx.error); };
      });
    });
  }

  // ---- permission ------------------------------------------------------
  const OPTS = { mode: "readwrite" };

  function permissionOf(handle, method) {
    if (!handle || typeof handle[method] !== "function") return Promise.resolve("granted");
    return Promise.resolve(handle[method](OPTS)).catch(function () { return "denied"; });
  }

  // ---- connection ------------------------------------------------------
  function init() {
    if (!isSupported() || !window.indexedDB) return Promise.resolve(getState());
    return idb("readonly", function (store) { return store.get(KEY); })
      .then(function (handle) {
        if (!handle) return setStatus("none", null);
        return permissionOf(handle, "queryPermission").then(function (perm) {
          setStatus(perm === "granted" ? "connected" : "needs-permission", handle);
        });
      })
      .catch(function (error) {
        console.warn("folder.init failed", error);
        setStatus("none", null);
      })
      .then(getState);
  }

  function pick() {
    if (!isSupported()) return Promise.reject(fail("not-connected", "unsupported"));
    return Promise.resolve()
      .then(function () { return window.showDirectoryPicker({ id: "procedure-editor", mode: "readwrite" }); })
      .then(function (handle) {
        return idb("readwrite", function (store) { return store.put(handle, KEY); })
          .catch(function (error) { console.warn("folder handle not persisted", error); })
          .then(function () {
            currentPath = null;
            setStatus("connected", handle);
            return getState();
          });
      }, function (error) {
        if (error && error.name === "AbortError") return null;
        throw fail("permission", error && error.message);
      });
  }

  function reconnect() {
    if (!root) return Promise.reject(fail("not-connected"));
    return permissionOf(root, "requestPermission").then(function (perm) {
      if (perm !== "granted") throw fail("permission", "permission " + perm);
      setStatus("connected");
      return getState();
    });
  }

  function disconnect() {
    currentPath = null;
    return idb("readwrite", function (store) { return store.delete(KEY); })
      .catch(function () {})
      .then(function () {
        setStatus("none", null);
        return getState();
      });
  }

  // ---- file access -----------------------------------------------------
  function requireRoot() {
    if (!root || status === "none") throw fail("not-connected");
    if (status !== "connected") throw fail("permission", "needs-permission");
    return root;
  }

  function mapError(error, fallback) {
    if (error && typeof error.code === "string") return error;
    const name = error && error.name;
    if (name === "NotFoundError" || name === "TypeMismatchError") return fail("not-found", error.message);
    if (name === "NotAllowedError" || name === "SecurityError") return fail("permission", error.message);
    return fail(fallback, error && error.message);
  }

  function splitPath(path) {
    const match = /^(?:(_parts)\/)?([^\/\\]+)$/.exec(String(path || ""));
    if (!match || match[2] === "." || match[2] === "..") throw fail("not-found", "bad path: " + path);
    return { dir: match[1] || "", name: match[2] };
  }

  function dirHandle(dir, create) {
    const base = requireRoot();
    if (!dir) return Promise.resolve(base);
    return base.getDirectoryHandle(dir, { create: !!create });
  }

  function listFiles(dir) {
    return Promise.resolve().then(function () {
      return dirHandle(dir, false);
    }).then(function (handle) {
      const jobs = [];
      return (async function () {
        for await (const entry of handle.values()) {
          if (entry.kind === "file" && /\.html$/i.test(entry.name)) {
            jobs.push(entry.getFile().then(function (file) {
              return { path: dir ? dir + "/" + entry.name : entry.name, name: entry.name, lastModified: file.lastModified };
            }));
          }
        }
        const list = await Promise.all(jobs);
        return list.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
      })();
    }).catch(function (error) {
      if (!dir && error && typeof error.code === "string") throw error;
      if (error && error.name === "NotFoundError") return [];
      throw mapError(error, "not-found");
    });
  }

  function listDocs() { return listFiles(""); }
  function listParts() { return listFiles(PARTS_DIR); }

  function readText(path) {
    return Promise.resolve().then(function () {
      const p = splitPath(path);
      return dirHandle(p.dir, false).then(function (dir) { return dir.getFileHandle(p.name); });
    }).then(function (fh) { return fh.getFile(); })
      .then(function (file) { return file.text(); })
      .catch(function (error) { throw mapError(error, "not-found"); });
  }

  function writeText(path, text) {
    return Promise.resolve().then(function () {
      const p = splitPath(path);
      return dirHandle(p.dir, true).then(function (dir) { return dir.getFileHandle(p.name, { create: true }); });
    }).then(function (fh) {
      return fh.createWritable().then(function (writable) {
        return writable.write(String(text)).then(function () { return writable.close(); }, function (error) {
          return Promise.resolve(writable.abort && writable.abort()).catch(function () {}).then(function () { throw error; });
        });
      });
    }).catch(function (error) {
      const mapped = mapError(error, "write-failed");
      throw mapped.code === "not-found" ? fail("write-failed", mapped.message) : mapped;
    });
  }

  function exists(path) {
    return readText(path).then(function () { return true; }, function (error) {
      if (error.code === "not-found") return false;
      throw error;
    });
  }

  function uniquePath(dir, baseName) {
    const prefix = dir ? dir + "/" : "";
    const base = String(baseName || "").replace(/\.html$/i, "");
    function attempt(n) {
      const path = prefix + base + (n > 1 ? " (" + n + ")" : "") + ".html";
      return exists(path).then(function (found) { return found ? attempt(n + 1) : path; });
    }
    return Promise.resolve().then(function () { requireRoot(); return attempt(1); });
  }

  function setCurrentPath(path) { currentPath = path || null; }
  function getCurrentPath() { return currentPath; }

  ns.folder = {
    isSupported, init, pick, reconnect, disconnect, getState, onChange,
    listDocs, listParts, readText, writeText, exists, uniquePath,
    setCurrentPath, getCurrentPath
  };
})(window.ProcedureEditor = window.ProcedureEditor || {});
