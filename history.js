/**
 * history.js
 * Undo / redo via full snapshots of sstore + imgs.
 * Depends on: config.js (imgs, sstore), editor.js (renderPage)
 */

const _undoStack = [];
const _redoStack = [];
const MAX_HISTORY = 35;

function _hsnap() {
  return JSON.stringify({
    sstore:     JSON.parse(JSON.stringify(sstore)),
    imgs:       Object.assign({}, imgs),
    pageFrames: JSON.parse(JSON.stringify(pageFrames)),
  });
}

function _happly(raw) {
  const s = JSON.parse(raw);
  Object.keys(sstore).forEach(k => delete sstore[k]);
  Object.assign(sstore, s.sstore);
  Object.keys(imgs).forEach(k => delete imgs[k]);
  Object.assign(imgs, s.imgs);
  Object.keys(pageFrames).forEach(k => delete pageFrames[k]);
  Object.assign(pageFrames, JSON.parse(JSON.stringify(s.pageFrames || {})));
  renderPage();
  scheduleSave?.();
  _huiUpdate();
}

/** Call before any state-mutating action (photo upload, sticker add/delete). */
function pushHistory() {
  _undoStack.push(_hsnap());
  if (_undoStack.length > MAX_HISTORY) _undoStack.shift();
  _redoStack.length = 0;
  _huiUpdate();
}

function undo() {
  if (!_undoStack.length) return;
  _redoStack.push(_hsnap());
  _happly(_undoStack.pop());
}

function redo() {
  if (!_redoStack.length) return;
  _undoStack.push(_hsnap());
  _happly(_redoStack.pop());
}

function _huiUpdate() {
  const u = document.getElementById('undoBtn');
  const r = document.getElementById('redoBtn');
  if (u) u.disabled = _undoStack.length === 0;
  if (r) r.disabled = _redoStack.length === 0;
}
