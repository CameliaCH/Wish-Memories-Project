/**
 * stickers.js
 * All on-canvas elements: text boxes, image stickers.
 * Every element uses a shared wrapper with:
 *   • delta-based drag (smooth, rotation-safe)
 *   • rotate handle + degree badge
 *   • × delete button
 *   • text formatting: bold, italic, align
 * Keyboard shortcuts: Delete, Ctrl+Z/Y, Arrow nudge
 */

// ── Shared active-element tracker ───────────────────────────────
let _activeWrap = null;

// ── Dropzone (for future drag-from-bar support) ──────────────────
function setupDropzone(el, key) {
  // No drag-from-bar in this version; stickers placed via sidebar click.
}

// ── Add functions (called externally) ───────────────────────────

function addTextBox(key, x, y, text, fontSize, color, fontFamily) {
  const bold      = document.getElementById('fmtBold')?.classList.contains('on')      ?? true;
  const italic    = document.getElementById('fmtItalic')?.classList.contains('on')    ?? false;
  const underline = document.getElementById('fmtUnderline')?.classList.contains('on') ?? false;
  const align     = _activeAlign();
  const item      = { type: 'text', text, x, y, fontSize, color, fontFamily, rotation: 0, bold, italic, underline, align };
  if (!sstore[key]) sstore[key] = [];
  sstore[key].push(item);
  _renderItem(key, item);
  scheduleSave?.();
}

function addImageSticker(key, src, x, y, size, rotation) {
  rotation = rotation || 0;
  const item = { type: 'img', src, x, y, size, rotation };
  if (!sstore[key]) sstore[key] = [];
  sstore[key].push(item);
  _renderItem(key, item);
  scheduleSave?.();
}

// ── Rendering dispatcher ─────────────────────────────────────────
function _renderItem(key, item) {
  const layer = document.getElementById('sl-' + key);
  if (!layer) return;

  let wrap;
  if (item.type === 'text') {
    wrap = _makeTextWrap(item);
  } else if (item.type === 'img') {
    wrap = _makeImgWrap(item);
  } else {
    return;
  }

  layer.appendChild(wrap);
  _makeDraggable(wrap, item);
}

// ── TEXT WRAPPER ─────────────────────────────────────────────────
function _makeTextWrap(item) {
  if (item.rotation  === undefined) item.rotation  = 0;
  if (item.bold      === undefined) item.bold      = true;
  if (item.italic    === undefined) item.italic    = false;
  if (item.underline === undefined) item.underline = false;
  if (item.align     === undefined) item.align     = 'left';

  const wrap = document.createElement('div');
  wrap.className       = 'textbox-wrap';
  wrap.style.left      = item.x + 'px';
  wrap.style.top       = item.y + 'px';
  wrap.style.transform = `rotate(${item.rotation}deg)`;

  wrap.addEventListener('mousedown', () => _syncToolbar(wrap, item));

  // × delete
  const del = _makeDelBtn(() => {
    pushHistory?.();
    if (_activeWrap === wrap) _activeWrap = null;
    wrap.remove();
    _removeFromSstore(item);
    scheduleSave?.();
  });
  wrap.appendChild(del);

  // Rotate badge + handle
  const { badge, handle } = _makeRotateControls(wrap, item);
  wrap.appendChild(badge);
  wrap.appendChild(handle);

  // Editable text element
  const t = document.createElement('div');
  t.className           = 'textbox';
  t.contentEditable     = 'true';
  t.spellcheck          = false;
  t.dataset.placeholder = 'Type here…';
  t.style.fontSize      = item.fontSize + 'px';
  t.style.color         = item.color;
  t.style.fontFamily    = `'${item.fontFamily}', cursive`;
  t.style.fontWeight      = item.bold      ? '800' : '400';
  t.style.fontStyle       = item.italic    ? 'italic' : 'normal';
  t.style.textDecoration  = item.underline ? 'underline' : 'none';
  t.style.textAlign       = item.align     || 'left';
  if (item.text) t.innerHTML = item.text;

  t.addEventListener('input', () => { item.text = t.innerHTML === '<br>' ? '' : t.innerHTML; scheduleSave?.(); });

  t.addEventListener('focus', () => {
    _activeWrap = wrap;
    _syncFmtButtons(item);

    const sizeInp = document.getElementById('textSize');
    if (sizeInp) {
      sizeInp.removeEventListener('input', sizeInp._tbCb);
      sizeInp._tbCb = () => {
        const v = parseInt(sizeInp.value);
        if (!isNaN(v) && v >= 1) { item.fontSize = v; t.style.fontSize = v + 'px'; scheduleSave?.(); }
      };
      sizeInp.addEventListener('input', sizeInp._tbCb);
    }

    const colorInp = document.getElementById('textColor');
    if (colorInp) {
      colorInp.removeEventListener('input', colorInp._tbCb);
      colorInp._tbCb = () => { item.color = colorInp.value; t.style.color = colorInp.value; scheduleSave?.(); };
      colorInp.addEventListener('input', colorInp._tbCb);
    }
  });

  wrap.appendChild(t);
  return wrap;
}

// ── IMAGE STICKER WRAPPER ─────────────────────────────────────────
function _makeImgWrap(item) {
  const wrap = document.createElement('div');
  wrap.className       = 'stk-wrap';
  wrap.style.left      = item.x + 'px';
  wrap.style.top       = item.y + 'px';
  wrap.style.transform = `rotate(${item.rotation}deg)`;

  wrap.addEventListener('mousedown', () => _syncToolbar(wrap, item));

  // × delete
  const del = _makeDelBtn(() => {
    pushHistory?.();
    if (_activeWrap === wrap) _activeWrap = null;
    wrap.remove();
    _removeFromSstore(item);
    scheduleSave?.();
  });
  wrap.appendChild(del);

  // Rotate badge + handle
  const { badge, handle } = _makeRotateControls(wrap, item);
  wrap.appendChild(badge);
  wrap.appendChild(handle);

  // The image
  const img = document.createElement('img');
  img.src              = item.src;
  img.style.width      = item.size + 'px';
  img.style.height     = item.size + 'px';
  img.style.display    = 'block';
  img.style.objectFit  = 'contain';
  img.style.userSelect = 'none';
  img.draggable        = false;

  img.addEventListener('mousedown', () => {
    _activeWrap = wrap;
    const sizeInp = document.getElementById('stickerSize');
    if (sizeInp) {
      sizeInp.removeEventListener('input', sizeInp._stkCb);
      sizeInp._stkCb = () => {
        const v = parseInt(sizeInp.value);
        if (!isNaN(v) && v >= 10) { item.size = v; img.style.width = v + 'px'; img.style.height = v + 'px'; scheduleSave?.(); }
      };
      sizeInp.addEventListener('input', sizeInp._stkCb);
    }
  });

  wrap.appendChild(img);
  return wrap;
}

// ── SHARED CONTROL BUILDERS ──────────────────────────────────────

function _makeDelBtn(onDelete) {
  const del = document.createElement('div');
  del.className   = 'textbox-del';
  del.textContent = '×';
  del.title       = 'Delete';
  del.addEventListener('mousedown', e => e.stopPropagation());
  del.addEventListener('click',     e => { e.stopPropagation(); onDelete(); });
  return del;
}

function _makeRotateControls(wrap, item) {
  const badge = document.createElement('div');
  badge.className   = 'textbox-rot-badge';
  badge.textContent = (item.rotation || 0) + '°';

  const handle = document.createElement('div');
  handle.className = 'textbox-rotate-handle';
  handle.title     = 'Drag to rotate';

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    const onMove = ev => {
      const rect = wrap.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const deg  = Math.round(Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90);
      item.rotation         = deg;
      wrap.style.transform  = `rotate(${deg}deg)`;
      badge.textContent     = deg + '°';
      const rotInput = _getActiveRotInput(item);
      if (rotInput) rotInput.value = deg;
    };
    const onUp = () => {
      scheduleSave?.();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  return { badge, handle };
}

function _getActiveRotInput(item) {
  return item.type === 'text'
    ? document.getElementById('textRotate')
    : document.getElementById('stickerRotate');
}

function _syncToolbar(wrap, item) {
  _activeWrap = wrap;
  if (item.type === 'text') {
    const sz = document.getElementById('textSize');
    const rt = document.getElementById('textRotate');
    const cl = document.getElementById('textColor');
    if (sz) sz.value = item.fontSize;
    if (rt) rt.value = Math.round(item.rotation || 0);
    if (cl) cl.value = item.color || '#1A3A5C';
    _syncFmtButtons(item);
  } else if (item.type === 'img') {
    const sz = document.getElementById('stickerSize');
    const rt = document.getElementById('stickerRotate');
    if (sz) sz.value = item.size;
    if (rt) rt.value = Math.round(item.rotation || 0);
  }
}

// ── Text formatting ───────────────────────────────────────────────

function _activeAlign() {
  if (document.getElementById('fmtAlignC')?.classList.contains('on')) return 'center';
  if (document.getElementById('fmtAlignR')?.classList.contains('on')) return 'right';
  return 'left';
}

function _syncFmtButtons(item) {
  const bold      = document.getElementById('fmtBold');
  const italic    = document.getElementById('fmtItalic');
  const underline = document.getElementById('fmtUnderline');
  const alignL    = document.getElementById('fmtAlignL');
  const alignC    = document.getElementById('fmtAlignC');
  const alignR    = document.getElementById('fmtAlignR');
  if (bold)      bold.classList.toggle('on',      !!item.bold);
  if (italic)    italic.classList.toggle('on',    !!item.italic);
  if (underline) underline.classList.toggle('on', !!item.underline);
  if (alignL)    alignL.classList.toggle('on',    (item.align || 'left') === 'left');
  if (alignC)    alignC.classList.toggle('on',    item.align === 'center');
  if (alignR)    alignR.classList.toggle('on',    item.align === 'right');
}

function updateSelectedBold() {
  if (!_activeWrap?._item || _activeWrap._item.type !== 'text') return;
  const item = _activeWrap._item;
  item.bold = !item.bold;
  _activeWrap.querySelector('.textbox').style.fontWeight = item.bold ? '800' : '400';
  document.getElementById('fmtBold')?.classList.toggle('on', item.bold);
  scheduleSave?.();
}

function updateSelectedItalic() {
  if (!_activeWrap?._item || _activeWrap._item.type !== 'text') return;
  const item = _activeWrap._item;
  item.italic = !item.italic;
  _activeWrap.querySelector('.textbox').style.fontStyle = item.italic ? 'italic' : 'normal';
  document.getElementById('fmtItalic')?.classList.toggle('on', item.italic);
  scheduleSave?.();
}

function updateSelectedUnderline() {
  if (!_activeWrap?._item || _activeWrap._item.type !== 'text') return;
  const item = _activeWrap._item;
  item.underline = !item.underline;
  _activeWrap.querySelector('.textbox').style.textDecoration = item.underline ? 'underline' : 'none';
  document.getElementById('fmtUnderline')?.classList.toggle('on', item.underline);
  scheduleSave?.();
}

function updateSelectedAlign(val) {
  if (!_activeWrap?._item || _activeWrap._item.type !== 'text') return;
  const item = _activeWrap._item;
  item.align = val;
  _activeWrap.querySelector('.textbox').style.textAlign = val;
  ['fmtAlignL', 'fmtAlignC', 'fmtAlignR'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('on', btn.dataset.align === val);
  });
  scheduleSave?.();
}

// ── Text colour picker (theme swatches) ──────────────────────────
function pickTextColor(idx) {
  const color = CFG.colors[idx];
  if (!color) return;
  const inp = document.getElementById('textColor');
  if (inp) inp.value = color;
  if (!_activeWrap?._item || _activeWrap._item.type !== 'text') return;
  const item = _activeWrap._item;
  item.color = color;
  _activeWrap.querySelector('.textbox').style.color = color;
  scheduleSave?.();
}

// ── Sticker size input handler ───────────────────────────────────
function updateStickerSize(val) {
  if (!_activeWrap?._item || _activeWrap._item.type !== 'img') return;
  const v = parseInt(val);
  if (isNaN(v) || v < 10) return;
  const item = _activeWrap._item;
  item.size = v;
  const img = _activeWrap.querySelector('img');
  if (img) { img.style.width = v + 'px'; img.style.height = v + 'px'; }
  scheduleSave?.();
}

// ── Toolbar rotation input handler (called via oninput in HTML) ──
function updateSelectedRotation(val) {
  if (!_activeWrap) return;
  const deg  = parseFloat(val) || 0;
  _activeWrap.style.transform = `rotate(${deg}deg)`;
  const badge = _activeWrap.querySelector('.textbox-rot-badge');
  if (badge) badge.textContent = deg + '°';
  _activeWrap._item && (_activeWrap._item.rotation = deg);
  scheduleSave?.();
}

// ── RESTORE ──────────────────────────────────────────────────────
function restoreS(key, immediate = false) {
  const stored = sstore[key];
  if (!stored || !stored.length) return;
  const render = () => stored.forEach(item => _renderItem(key, item));
  immediate ? render() : setTimeout(render, 10);
}

// ── Remove item from sstore when deleted from canvas ─────────────
function _removeFromSstore(item) {
  for (const key of Object.keys(sstore)) {
    const arr = sstore[key];
    const idx = arr.indexOf(item);
    if (idx !== -1) { arr.splice(idx, 1); break; }
  }
}

// ── DELTA-BASED DRAG ─────────────────────────────────────────────
const DRAG_THRESHOLD = 5;

function _makeDraggable(wrap, item) {
  wrap._item = item;

  const textChild = () => wrap.querySelector('.textbox');
  const isText    = () => !!textChild();

  wrap.addEventListener('mousedown', e => {
    if (e.target.closest('.textbox-del') ||
        e.target.closest('.textbox-rotate-handle')) return;
    if (isText() && document.activeElement === textChild()) return;

    const startX   = e.clientX;
    const startY   = e.clientY;
    let   baseLeft = parseFloat(wrap.style.left) || 0;
    let   baseTop  = parseFloat(wrap.style.top)  || 0;
    let   dragging = false;

    const move = ev => {
      const zoom = window._canvasZoom || 1;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        dragging = true;
        wrap.style.cursor = 'grabbing';
      }
      ev.preventDefault();
      const newLeft = baseLeft + dx;
      const newTop  = baseTop  + dy;
      wrap.style.left = newLeft + 'px';
      wrap.style.top  = newTop + 'px';
      item.x = Math.round(newLeft);
      item.y = Math.round(newTop);
    };

    const up = () => {
      wrap.style.cursor = '';
      if (dragging) scheduleSave?.();
      if (!dragging && isText()) {
        const tc = textChild();
        if (tc) {
          tc.focus();
          const range = document.createRange();
          const sel   = window.getSelection();
          range.selectNodeContents(tc);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup',   up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup',   up);
  });
}

// ── Keyboard shortcuts ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName;
  const ce  = document.activeElement?.contentEditable === 'true';

  // Undo/redo always (even in inputs)
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
    e.preventDefault(); undo?.(); return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    e.preventDefault(); redo?.(); return;
  }

  // Rest only when not typing in an input/textarea/contenteditable
  if (tag === 'INPUT' || tag === 'TEXTAREA' || ce) return;

  // Delete active element
  if ((e.key === 'Delete' || e.key === 'Backspace') && _activeWrap) {
    pushHistory?.();
    _removeFromSstore(_activeWrap._item);
    _activeWrap.remove();
    _activeWrap = null;
    scheduleSave?.();
    return;
  }

  // Arrow-key nudge
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key) && _activeWrap) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 2;
    const dx   = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
    const dy   = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0;
    const x    = (parseFloat(_activeWrap.style.left) || 0) + dx;
    const y    = (parseFloat(_activeWrap.style.top)  || 0) + dy;
    _activeWrap.style.left = x + 'px';
    _activeWrap.style.top  = y + 'px';
    if (_activeWrap._item) { _activeWrap._item.x = x; _activeWrap._item.y = y; }
    scheduleSave?.();
  }
});

// ── Custom sticker upload (from Customise tab) ───────────────────
function addCustomStickers(input) {
  Array.from(input.files).forEach(f => {
    const r = new FileReader();
    r.onload = e => {
      CFG.customStickers.push({ name: f.name, url: e.target.result });
      const area = document.getElementById('stkArea');
      if (area) {
        const t = document.createElement('div');
        t.className = 'cst';
        t.innerHTML = `<img src="${e.target.result}"><div class="del" onclick="this.parentElement.remove()">×</div>`;
        area.insertBefore(t, area.children[0]);
      }
      _rebuildCustomStickerGrid?.();
      scheduleSave?.();
    };
    r.readAsDataURL(f);
  });
  input.value = '';
}

// ── Sticker grid rebuild helper ──────────────────────────────────
function rebuildStickerBar() { _rebuildCustomStickerGrid?.(); }
