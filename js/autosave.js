/**
 * autosave.js
 * Persists CFG, sstore, pageFrames to localStorage.
 * Images (imgs) stored in IndexedDB — far larger capacity than localStorage.
 */

const LS_KEY    = 'maw_pb_v2';
const IDB_NAME  = 'maw_pb_imgs';
const IDB_STORE = 'data';
let   _idb      = null;

// ── IndexedDB helpers ────────────────────────────────────────────
function _openIDB() {
  return new Promise((resolve, reject) => {
    if (_idb) { resolve(_idb); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess       = e => { _idb = e.target.result; resolve(_idb); };
    req.onerror         = ()  => reject(new Error('IndexedDB unavailable'));
  });
}

function _idbPut(key, val) {
  return _openIDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(val, key);
    tx.oncomplete = res;
    tx.onerror    = rej;
  }));
}

function _idbGet(key) {
  return _openIDB().then(db => new Promise((res, rej) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror   = rej;
  }));
}

// ── Save ─────────────────────────────────────────────────────────
function saveState() {
  const data = {
    cfg: {
      colors: [...CFG.colors], font: CFG.font, shape: CFG.shape,
      pageBg: CFG.pageBg,
      // customStickers omitted — saved to IndexedDB separately
    },
    pageFrames: JSON.parse(JSON.stringify(pageFrames)),
    sstore:     JSON.parse(JSON.stringify(sstore)),
    name:  document.getElementById('cName')?.value || '',
    age:   document.getElementById('cAge')?.value  || '',
    wish:  document.getElementById('cWish')?.value || '',
  };

  // Try localStorage (fast, synchronous)
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch(e) {
    console.warn('localStorage save failed (quota?), falling back to IDB only:', e.message);
  }

  // Always save to IndexedDB too — this is the reliable fallback
  // (sstore items may contain large custom-sticker data URLs)
  _idbPut('state', data)
    .catch(e => console.warn('IndexedDB state save failed:', e.message));
  _idbPut('imgs', Object.assign({}, imgs))
    .catch(e => console.warn('IndexedDB imgs save failed:', e.message));
  _idbPut('customStickers', JSON.parse(JSON.stringify(CFG.customStickers)))
    .catch(e => console.warn('IndexedDB customStickers save failed:', e.message));
}

/**
 * Async — must be awaited before building the UI.
 * Returns true if a saved state was found.
 */
async function restoreState() {
  let s = null;

  // IndexedDB is the primary source — it is always written, never fails on quota.
  // localStorage can overflow silently and hold stale data, so read IDB first.
  try {
    const idbState = await _idbGet('state');
    if (idbState && idbState.sstore) s = idbState;
  } catch(e) { /* IndexedDB unavailable */ }

  // Fall back to localStorage only if IDB had nothing
  if (!s) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) s = JSON.parse(raw);
    } catch(e) { /* ignore */ }
  }

  if (s) {
    if (s.cfg) {
      if (Array.isArray(s.cfg.colors)) {
        s.cfg.colors.forEach((c, i) => { if (i < CFG.colors.length) CFG.colors[i] = c; });
      }
      if (s.cfg.font)   CFG.font   = s.cfg.font;
      if (s.cfg.shape)  CFG.shape  = s.cfg.shape;
      if (s.cfg.pageBg) CFG.pageBg = s.cfg.pageBg;
      if (Array.isArray(s.cfg.customStickers)) CFG.customStickers = s.cfg.customStickers;
    }
    if (s.pageFrames) {
      Object.keys(pageFrames).forEach(k => delete pageFrames[k]);
      Object.assign(pageFrames, JSON.parse(JSON.stringify(s.pageFrames)));
    }
    if (s.sstore) {
      Object.keys(sstore).forEach(k => delete sstore[k]);
      Object.assign(sstore, s.sstore);
    }
    const set = (id, v) => { if (v) { const el = document.getElementById(id); if (el) el.value = v; } };
    set('cName', s.name);
    set('cAge',  s.age);
    set('cWish', s.wish);
  }

  // Load imgs from IndexedDB; fall back to legacy localStorage imgs for migration
  try {
    const idbImgs = await _idbGet('imgs');
    if (idbImgs && Object.keys(idbImgs).length) {
      Object.keys(imgs).forEach(k => delete imgs[k]);
      Object.assign(imgs, idbImgs);
    } else if (s?.imgs) {
      // One-time migration: old save had imgs in localStorage → move to IndexedDB
      Object.keys(imgs).forEach(k => delete imgs[k]);
      Object.assign(imgs, s.imgs);
      _idbPut('imgs', Object.assign({}, imgs)).catch(() => {});
    }
  } catch(e) {
    if (s?.imgs) {
      Object.keys(imgs).forEach(k => delete imgs[k]);
      Object.assign(imgs, s.imgs);
    }
  }

  // Load customStickers from IndexedDB (too large for localStorage)
  try {
    const idbStickers = await _idbGet('customStickers');
    if (Array.isArray(idbStickers) && idbStickers.length) {
      CFG.customStickers = idbStickers;
    } else if (Array.isArray(s?.cfg?.customStickers) && s.cfg.customStickers.length) {
      // One-time migration from old localStorage format
      CFG.customStickers = s.cfg.customStickers;
      _idbPut('customStickers', CFG.customStickers).catch(() => {});
    }
  } catch(e) {
    if (Array.isArray(s?.cfg?.customStickers)) CFG.customStickers = s.cfg.customStickers;
  }

  return !!s;
}

function clearSave() {
  localStorage.removeItem(LS_KEY);
  _idbPut('imgs', {}).catch(() => {});
  _idbPut('customStickers', []).catch(() => {});
  _idbPut('state', null).catch(() => {});
}

// Debounced save — batches rapid changes into one write
let _saveTimer = null;
function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(saveState, 700);
}
