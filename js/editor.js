/**
 * editor.js
 * Tab switching, page navigation, photo uploads, sidebar, text/sticker placement,
 * zoom controls, and photo crop/reposition modal.
 */

// ── Side selection state ─────────────────────────────────────────
let _activeSide = 'L';
const SPREAD_TYPES = ['sa', 'sb', 'sc', 'sd', 'info-spread'];

function setSide(side) {
  _activeSide = side;
  document.getElementById('sppL').classList.toggle('on', side === 'L');
  document.getElementById('sppR').classList.toggle('on', side === 'R');
}

function _currentLayerKey(pg) {
  if (SPREAD_TYPES.includes(pg.type)) return pg.id + '-' + _activeSide;
  return pg.id;
}

function _updatePagePicker(pg) {
  const picker = document.getElementById('sbPagePicker');
  if (!picker) return;
  const isSpread = SPREAD_TYPES.includes(pg.type);
  picker.style.display = isSpread ? 'flex' : 'none';
  if (isSpread) setSide('L');
}

// ── Tab switching ────────────────────────────────────────────────
function goTab(tab) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));

  if (tab === 'c') {
    document.getElementById('vc').classList.add('on');
    document.getElementById('t1').classList.add('on');
    document.getElementById('eActs').style.display = 'none';
  } else {
    document.getElementById('ve').classList.add('on');
    document.getElementById('t2').classList.remove('off');
    document.getElementById('t2').classList.add('on');
    document.getElementById('eActs').style.display = 'flex';
    buildThumbs();
    setPage(curPage);
  }
}

// ── Sidebar ──────────────────────────────────────────────────────
let sidebarOpen = false;

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sb  = document.getElementById('sidebar');
  const btn = document.getElementById('sidebarBtn');
  sb.classList.toggle('open', sidebarOpen);
  btn.classList.toggle('active', sidebarOpen);
}

function sbTab(tab) {
  document.querySelectorAll('.sb-tab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.sb-panel').forEach(p => p.style.display = 'none');
  document.getElementById('sbt-' + tab).classList.add('on');
  document.getElementById('sbp-' + tab).style.display = 'flex';
}

// ── Sticker grid ─────────────────────────────────────────────────
function buildStickerGrid() {
  const grid = document.getElementById('stickerGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Upload button
  const upBtn = document.createElement('div');
  upBtn.className = 'sticker-thumb sticker-upload-btn';
  upBtn.title     = 'Upload custom sticker';
  upBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
    <line x1="12" y1="8" x2="12" y2="14"/>
    <line x1="9" y1="11" x2="15" y2="11"/>
  </svg>`;
  upBtn.addEventListener('click', () => document.getElementById('stkUp').click());
  grid.appendChild(upBtn);

  STICKER_FILES.forEach(file => {
    const thumb = document.createElement('div');
    thumb.className = 'sticker-thumb';
    thumb.title     = file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const src = STICKER_DATA_URLS[file] || (STICKERS_PATH + file);
    thumb.innerHTML = `<img src="${src}" alt="${file}">`;
    thumb.addEventListener('click', () => _placeImageSticker(file));
    grid.appendChild(thumb);
  });

  _rebuildCustomStickerGrid();
}

function _rebuildCustomStickerGrid() {
  const grid = document.getElementById('stickerGrid');
  if (!grid) return;
  grid.querySelectorAll('.custom-sticker-thumb').forEach(e => e.remove());

  CFG.customStickers.forEach((cs) => {
    const thumb = document.createElement('div');
    thumb.className = 'sticker-thumb custom-sticker-thumb';
    thumb.title     = cs.name;
    thumb.innerHTML = `<img src="${cs.url}" alt="${cs.name}">`;
    thumb.addEventListener('click', () => _placeImageStickerFromURL(cs.url));
    grid.appendChild(thumb);
  });
}

// ── Sticker placement ─────────────────────────────────────────────
function _placeImageSticker(file) {
  // Use pre-bundled data URL so the sticker is always exportable (no file:// fetch needed)
  _placeOnLayer(STICKER_DATA_URLS[file] || STICKERS_PATH + file);
}
function _placeImageStickerFromURL(url) { _placeOnLayer(url); }

function _placeOnLayer(src) {
  const pg  = PAGES[curPage];
  const key = _currentLayerKey(pg);
  const sz  = parseInt(document.getElementById('stickerSize')?.value || 80);
  const rot = parseInt(document.getElementById('stickerRotate')?.value || 0);
  const x   = 220 - sz / 2;
  const y   = 220 - sz / 2;
  pushHistory?.();
  addImageSticker(key, src, x, y, sz, rot);
}

// ── Page rendering ───────────────────────────────────────────────
function rp() { renderPage(); }

function renderPage() {
  const wrap = document.getElementById('cwrap');
  wrap.innerHTML = '';
  const pg = PAGES[curPage];
  const el = buildPage(pg);
  wrap.appendChild(el);

  // Restore stickers now that element is in the DOM
  if (SPREAD_TYPES.includes(pg.type)) {
    restoreS(pg.id + '-L', true);
    restoreS(pg.id + '-R', true);
    const sides = el.querySelectorAll('.sp');
    sides.forEach((sp, i) => {
      const key = pg.id + (i === 0 ? '-L' : '-R');
      setupDropzone(sp, key);
    });
  } else {
    restoreS(pg.id, true);
    setupDropzone(el, pg.id);
  }

  _updatePagePicker(pg);
}

// ── Page navigation ──────────────────────────────────────────────
function buildThumbs() {
  const strip = document.getElementById('tstrip');
  if (!strip) return;
  strip.innerHTML = '';
  PAGES.forEach((pg, i) => {
    const t = document.createElement('div');
    t.className = 'th' + (i === curPage ? ' on' : '');
    t.id        = 'th-' + i;
    t.onclick   = () => setPage(i);
    t.innerHTML = '<div>' + pg.label.replace('–', '–<br>') + '</div>';
    strip.appendChild(t);
  });
}

function gp(dir) { setPage(curPage + dir); }

function setPage(idx) {
  idx = Math.max(0, Math.min(PAGES.length - 1, idx));
  curPage = idx;
  renderPage();
  document.getElementById('pvb').disabled = idx === 0;
  document.getElementById('nxb').disabled = idx === PAGES.length - 1;
  document.getElementById('pinfo').textContent = PAGES[idx].label;
  document.querySelectorAll('.th').forEach((t, i) => t.classList.toggle('on', i === idx));
  document.getElementById('th-' + idx)
    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// ── Photo upload ─────────────────────────────────────────────────
function upload(sid) {
  let inp = document.getElementById('fi-' + sid);
  if (!inp) {
    inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'fi-' + sid; inp.style.display = 'none';
    inp.addEventListener('change', () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = e => {
        pushHistory?.();
        imgs[sid] = { url: e.target.result, ox: 50, oy: 50, zoom: 1 };
        renderPage();
        scheduleSave?.();
        if (_cropSid === sid) _cropRefreshPreview();
      };
      r.readAsDataURL(f);
    });
    document.getElementById('fi').appendChild(inp);
  }
  inp.click();
}

// ── Text placement ────────────────────────────────────────────────
function placeTextBox() {
  const pg       = PAGES[curPage];
  const key      = _currentLayerKey(pg);
  const fontSize = parseInt(document.getElementById('textSize')?.value || 20);
  const color    = document.getElementById('textColor')?.value || '#1A3A5C';
  pushHistory?.();
  addTextBox(key, 160, 60, '', fontSize, color, CFG.font);
}

// ── Zoom controls ─────────────────────────────────────────────────
let _canvasZoom = 1.0;
const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.75, 1.0, 1.25, 1.5, 2.0];

function zoomIn() {
  const idx = ZOOM_STEPS.findIndex(z => z >= _canvasZoom - 0.01);
  const next = idx < ZOOM_STEPS.length - 1 ? idx + 1 : idx;
  setZoom(ZOOM_STEPS[next]);
}

function zoomOut() {
  const idx = ZOOM_STEPS.findIndex(z => z >= _canvasZoom - 0.01);
  const prev = idx > 0 ? idx - 1 : 0;
  setZoom(ZOOM_STEPS[prev]);
}

function setZoom(z) {
  _canvasZoom = z;
  const cwrap = document.getElementById('cwrap');
  if (cwrap) {
    cwrap.style.transform       = `scale(${z})`;
    cwrap.style.transformOrigin = 'top center';
  }
  const lbl = document.getElementById('zoomPct');
  if (lbl) lbl.textContent = Math.round(z * 100) + '%';
}

// ── Crop / Reposition modal ───────────────────────────────────────
let _cropSid  = null;
let _cropOx   = 50;
let _cropOy   = 50;
let _cropZoom = 1;

function openCropModal(sid) {
  const stored = imgs[sid];
  if (!stored) { upload(sid); return; }
  const data = typeof stored === 'string'
    ? { url: stored, ox: 50, oy: 50, zoom: 1 }
    : { url: stored.url, ox: stored.ox ?? 50, oy: stored.oy ?? 50, zoom: stored.zoom ?? 1 };

  _cropSid  = sid;
  _cropOx   = data.ox;
  _cropOy   = data.oy;
  _cropZoom = data.zoom;

  const zSlider = document.getElementById('cropZoomSlider');
  if (zSlider) zSlider.value = Math.round(_cropZoom * 100);

  _cropRefreshPreview();
  document.getElementById('cropOverlay').style.display = 'flex';
  _cropSetupDrag();
}

function _cropRefreshPreview() {
  const vp = document.getElementById('cropViewport');
  if (!vp || !_cropSid) return;
  const stored = imgs[_cropSid];
  const url    = typeof stored === 'string' ? stored : stored?.url;
  if (!url) return;
  const bsize  = _cropZoom > 1 ? (_cropZoom * 100) + '%' : 'cover';
  vp.style.backgroundImage    = `url('${url}')`;
  vp.style.backgroundSize     = bsize;
  vp.style.backgroundPosition = `${_cropOx}% ${_cropOy}%`;
  vp.style.backgroundRepeat   = 'no-repeat';
}

function _cropSetupDrag() {
  const vp = document.getElementById('cropViewport');
  if (!vp) return;
  // Remove previous listeners by cloning
  const fresh = vp.cloneNode(true);
  vp.parentNode.replaceChild(fresh, vp);
  // Re-apply background
  const stored = imgs[_cropSid];
  const url    = typeof stored === 'string' ? stored : stored?.url;
  if (url) {
    fresh.style.backgroundImage    = `url('${url}')`;
    fresh.style.backgroundSize     = _cropZoom > 1 ? (_cropZoom * 100) + '%' : 'cover';
    fresh.style.backgroundPosition = `${_cropOx}% ${_cropOy}%`;
    fresh.style.backgroundRepeat   = 'no-repeat';
  }
  // Zoom slider
  document.getElementById('cropZoomSlider')?.addEventListener('input', function() {
    _cropZoom = parseInt(this.value) / 100;
    _cropRefreshPreview();
  });

  let dragStartX, dragStartY, dragOx, dragOy;
  fresh.addEventListener('mousedown', e => {
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOx     = _cropOx;
    dragOy     = _cropOy;
    fresh.style.cursor = 'grabbing';

    const move = ev => {
      if (_cropZoom <= 1) return;
      const cw   = fresh.clientWidth;
      const ch   = fresh.clientHeight;
      const imgW = cw * _cropZoom;
      const imgH = ch * _cropZoom;
      const rangeX = imgW - cw;
      const rangeY = imgH - ch;
      const dx   = ev.clientX - dragStartX;
      const dy   = ev.clientY - dragStartY;
      _cropOx = Math.max(0, Math.min(100, dragOx - (dx / rangeX) * 100));
      _cropOy = Math.max(0, Math.min(100, dragOy - (dy / rangeY) * 100));
      fresh.style.backgroundPosition = `${_cropOx}% ${_cropOy}%`;
    };
    const up = () => {
      fresh.style.cursor = 'grab';
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  fresh.style.cursor = 'grab';
}

function applyCrop() {
  if (!_cropSid) return;
  const stored = imgs[_cropSid];
  const url    = typeof stored === 'string' ? stored : stored?.url;
  pushHistory?.();
  imgs[_cropSid] = { url, ox: _cropOx, oy: _cropOy, zoom: _cropZoom };
  closeCropModal();
  renderPage();
  scheduleSave?.();
}

function replaceCropPhoto() {
  if (!_cropSid) return;
  const sid = _cropSid;
  closeCropModal();
  upload(sid);
}

function removeCropPhoto() {
  if (!_cropSid) return;
  pushHistory?.();
  delete imgs[_cropSid];
  closeCropModal();
  renderPage();
  scheduleSave?.();
}

function closeCropModal() {
  document.getElementById('cropOverlay').style.display = 'none';
  _cropSid = null;
}

// ── Direct photo pan (drag on canvas to move image within frame) ───
function startPhotoPan(e, el, sid) {
  e.stopPropagation(); // don't trigger frame drag

  const stored = imgs[sid];
  if (!stored) { upload(sid); return; }
  const data = typeof stored === 'string'
    ? { url: stored, ox: 50, oy: 50, zoom: 1 }
    : { url: stored.url, ox: stored.ox ?? 50, oy: stored.oy ?? 50, zoom: stored.zoom ?? 1 };

  const startX = e.clientX, startY = e.clientY;
  const origOx = data.ox, origOy = data.oy;
  let dragging = false;

  const move = ev => {
    const zoom = _canvasZoom || 1;
    const dx = (ev.clientX - startX) / zoom;
    const dy = (ev.clientY - startY) / zoom;
    if (Math.abs(dx) + Math.abs(dy) < 4) return;
    if (data.zoom <= 1) return; // can't pan at zoom=1; click will open modal instead
    if (!dragging) { pushHistory?.(); dragging = true; }
    ev.preventDefault();
    el.style.cursor = 'grabbing';
    const fw = el.offsetWidth  || el.parentElement.offsetWidth;
    const fh = el.offsetHeight || el.parentElement.offsetHeight;
    const rangeX = fw * data.zoom - fw;
    const rangeY = fh * data.zoom - fh;
    if (rangeX <= 0 || rangeY <= 0) return;
    data.ox = Math.max(0, Math.min(100, origOx - (dx / rangeX) * 100));
    data.oy = Math.max(0, Math.min(100, origOy - (dy / rangeY) * 100));
    el.style.backgroundPosition = `${data.ox}% ${data.oy}%`;
  };

  const up = () => {
    el.style.cursor = 'grab';
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    if (dragging) {
      imgs[sid] = { url: data.url, ox: data.ox, oy: data.oy, zoom: data.zoom };
      scheduleSave?.();
    } else {
      openCropModal(sid); // treat as click → open modal (for zoom / replace / remove)
    }
  };

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

// ── Frame count picker ────────────────────────────────────────────
let _lpKey = null;

const _LP_COUNT_THUMBS = [
  `<div style="position:absolute;inset:8px;border:2px dashed #ccc;border-radius:3px;opacity:.5"></div>`,
  `<div class="lp-frame" style="position:absolute;inset:8px"></div>`,
  `<div class="lp-frame" style="position:absolute;top:8px;left:8px;right:8px;bottom:53%"></div>
   <div class="lp-frame" style="position:absolute;top:52%;left:8px;right:8px;bottom:8px"></div>`,
  `<div class="lp-frame" style="position:absolute;top:8px;left:8px;right:8px;height:27%"></div>
   <div class="lp-frame" style="position:absolute;top:38%;left:8px;right:8px;height:27%"></div>
   <div class="lp-frame" style="position:absolute;bottom:8px;left:8px;right:8px;height:27%"></div>`,
];
const _LP_COUNT_LABELS = ['Blank', '1 Frame', '2 Frames', '3 Frames'];
const _LP_COUNT_VALUES = [0, 1, 2, 3];

function openLayoutPicker(key) {
  _lpKey = key;

  let overlay = document.getElementById('layoutPickerOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id        = 'layoutPickerOverlay';
    overlay.className = 'lp-overlay';
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLayoutPicker(); });
    overlay.innerHTML = `
      <div class="lp-modal">
        <div class="lp-title">Page Layout</div>
        <p class="lp-hint">Blank pages are great for text &amp; stickers. Drag frame handles to reposition, corners to resize.</p>
        <div class="lp-grid" id="lpGrid"></div>
        <button class="lp-cancel" onclick="closeLayoutPicker()">Cancel</button>
      </div>`;
    document.body.appendChild(overlay);
  }

  const current = pageFrames[key]?.length ?? 2;
  document.getElementById('lpGrid').innerHTML = _LP_COUNT_VALUES.map((n, i) => `
    <div class="lp-thumb${n === current ? ' on' : ''}" onclick="setFrameCount(${n})" title="${_LP_COUNT_LABELS[i]}">
      ${_LP_COUNT_THUMBS[i]}
      <div class="lp-label">${_LP_COUNT_LABELS[i]}</div>
    </div>`).join('');

  overlay.style.display = 'flex';
}

function setFrameCount(count) {
  if (!_lpKey) return;
  pushHistory?.();
  const tpl = FRAME_DEFAULTS[count] || FRAME_DEFAULTS[2];
  pageFrames[_lpKey] = tpl.map(f => ({ ...f }));
  closeLayoutPicker();
  renderPage();
  scheduleSave?.();
}

function closeLayoutPicker() {
  const overlay = document.getElementById('layoutPickerOverlay');
  if (overlay) overlay.style.display = 'none';
  _lpKey = null;
}

// ── Frame drag & resize ───────────────────────────────────────────
const _SP_SIZE = 560;
const _FRAME_MIN = 60;

function startFrameDrag(e, el, key, idx) {
  e.stopPropagation();
  // Resolve to the .sp-frame element (handle is a child of it)
  const frameEl = el.classList?.contains('sp-frame') ? el : el.closest('.sp-frame');
  if (!frameEl) return;

  const frame = pageFrames[key]?.[idx];
  if (!frame) return;

  const startX = e.clientX, startY = e.clientY;
  const origX = frame.x, origY = frame.y;
  let dragging = false;

  const move = ev => {
    const zoom = _canvasZoom || 1;
    const dx = (ev.clientX - startX) / zoom;
    const dy = (ev.clientY - startY) / zoom;
    if (!dragging && Math.abs(dx) + Math.abs(dy) < 4) return;
    if (!dragging) { pushHistory?.(); dragging = true; }
    ev.preventDefault();
    const nx = Math.max(0, Math.min(_SP_SIZE - frame.w, origX + dx));
    const ny = Math.max(0, Math.min(_SP_SIZE - frame.h, origY + dy));
    frameEl.style.left = nx + 'px';
    frameEl.style.top  = ny + 'px';
    frame.x = Math.round(nx);
    frame.y = Math.round(ny);
  };

  const up = () => {
    if (dragging) scheduleSave?.();
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

function startFrameResize(e, handleEl, key, idx, corner) {
  e.stopPropagation();
  e.preventDefault();

  const frame = pageFrames[key]?.[idx];
  if (!frame) return;
  const frameEl = handleEl.closest('.sp-frame');
  if (!frameEl) return;

  const startX = e.clientX, startY = e.clientY;
  const { x: ox, y: oy, w: ow, h: oh } = frame;
  let dragging = false;

  const calc = (ev) => {
    const zoom = _canvasZoom || 1;
    const dx = (ev.clientX - startX) / zoom;
    const dy = (ev.clientY - startY) / zoom;
    let { x, y, w, h } = { x: ox, y: oy, w: ow, h: oh };

    if (corner === 'se') { w = Math.max(_FRAME_MIN, ow + dx); h = Math.max(_FRAME_MIN, oh + dy); }
    if (corner === 'sw') { const nw = Math.max(_FRAME_MIN, ow - dx); x = ox + ow - nw; w = nw; h = Math.max(_FRAME_MIN, oh + dy); }
    if (corner === 'ne') { w = Math.max(_FRAME_MIN, ow + dx); const nh = Math.max(_FRAME_MIN, oh - dy); y = oy + oh - nh; h = nh; }
    if (corner === 'nw') { const nw = Math.max(_FRAME_MIN, ow - dx); x = ox + ow - nw; w = nw; const nh = Math.max(_FRAME_MIN, oh - dy); y = oy + oh - nh; h = nh; }

    // Clamp to page bounds
    x = Math.max(0, x); y = Math.max(0, y);
    w = Math.min(w, _SP_SIZE - x); h = Math.min(h, _SP_SIZE - y);
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  };

  const move = ev => {
    if (!dragging) { pushHistory?.(); dragging = true; }
    const { x, y, w, h } = calc(ev);
    frameEl.style.left   = x + 'px';
    frameEl.style.top    = y + 'px';
    frameEl.style.width  = w + 'px';
    frameEl.style.height = h + 'px';
  };

  const up = ev => {
    if (dragging) {
      const r = calc(ev);
      frame.x = r.x; frame.y = r.y; frame.w = r.w; frame.h = r.h;
      scheduleSave?.();
    }
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}
