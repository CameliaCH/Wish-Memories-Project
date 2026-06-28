/**
 * customise.js
 * Builds and manages the Customise tab UI.
 * Depends on: config.js, helpers.js, builder.js, autosave.js
 */

/** Called once on page load to build all customise tab UI. */
function buildCustomiseUI() {
  _buildPresets();
  _buildColorPickers();
  _buildFontGrid();
  _buildPageBgSection();
  _refreshThemeVars();
  _refreshShapeDemos();
}

/**
 * Re-syncs all customise tab UI controls to the current CFG values.
 * Called after restoreState() to reflect saved choices.
 */
function syncCustomiseUI() {
  // Colour pickers
  CFG.colors.forEach((col, i) => {
    const sw = document.getElementById('sw-' + i);
    const cp = document.getElementById('cp-' + i);
    if (sw) sw.style.background = col;
    if (cp) cp.value = col;
  });
  // Preset borders
  document.querySelectorAll('.preset').forEach((p, j) => {
    const match = PALETTES[j]?.c.every((c, i) => c.toLowerCase() === CFG.colors[i]?.toLowerCase());
    p.classList.toggle('sel', !!match);
  });
  // Font
  document.querySelectorAll('.fc').forEach(c => c.classList.remove('sel'));
  const fcEl = document.getElementById('fc-' + CFG.font.replace(/\s/g, '-'));
  if (fcEl) fcEl.classList.add('sel');
  // Shape
  document.getElementById('sh-curved')?.classList.toggle('sel', CFG.shape === 'curved');
  document.getElementById('sh-angular')?.classList.toggle('sel', CFG.shape === 'angular');
  // Page bg
  document.querySelectorAll('.pgstyle-card').forEach(c => {
    c.classList.toggle('sel', c.dataset.style === CFG.pageBg);
  });
  _refreshThemeVars();
  _refreshShapeDemos();
}

// ── Palette presets ──────────────────────────────────────────────
function _buildPresets() {
  const pp = document.getElementById('presets');
  PALETTES.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'preset' + (i === 0 ? ' sel' : '');
    el.id = 'pr-' + i;
    el.onclick = () => applyPalette(i);
    el.innerHTML =
      p.c.map(c => `<div class="dot" style="background:${c}"></div>`).join('') +
      `<span class="pname">${p.name}</span>`;
    pp.appendChild(el);
  });
}

function applyPalette(i) {
  document.querySelectorAll('.preset').forEach((p, j) => p.classList.toggle('sel', j === i));
  PALETTES[i].c.forEach((col, j) => _applyColor(j, col));
  refreshMiniPreview();
  scheduleSave?.();
}

// ── Individual colour pickers ────────────────────────────────────
function _buildColorPickers() {
  const cr = document.getElementById('cprow');
  CFG.colors.forEach((col, i) => {
    const d = document.createElement('div');
    d.className = 'cpi';
    d.innerHTML = `
      <div class="swatch" id="sw-${i}" style="background:${col}">
        <input type="color" id="cp-${i}" value="${col}" oninput="updateColor(${i}, this.value)">
      </div>
      <label>${ROLE[i]}</label>`;
    cr.appendChild(d);
  });
}

function updateColor(i, val, fromPreset = false) {
  CFG.colors[i] = val;
  document.getElementById('sw-' + i).style.background = val;
  document.getElementById('cp-' + i).value = val;
  if (!fromPreset) {
    document.querySelectorAll('.preset').forEach(p => p.classList.remove('sel'));
  }
  _refreshThemeVars();
  _refreshShapeDemos();
  refreshMiniPreview();
  scheduleSave?.();
}

function _applyColor(i, val) {
  updateColor(i, val, true);
}

function _refreshThemeVars() {
  const s = document.documentElement.style;
  CFG.colors.forEach((c, i) => s.setProperty('--tc' + i, c));
}

function _refreshShapeDemos() {
  document.querySelectorAll('.di.circ').forEach(el => { el.style.background = CFG.colors[0]; });
  document.querySelectorAll('.di.star').forEach(el => { el.style.background = CFG.colors[0]; });
  document.querySelectorAll('.di.hex').forEach(el  => { el.style.background = CFG.colors[2]; });
  document.querySelectorAll('.di.dia').forEach(el  => { el.style.background = CFG.colors[3]; });
}

// ── Font picker ──────────────────────────────────────────────────
function _buildFontGrid() {
  const fg = document.getElementById('fgrid');
  FONTS.forEach(f => {
    const d = document.createElement('div');
    d.className = 'fc' + (f.id === CFG.font ? ' sel' : '');
    d.id = 'fc-' + f.id.replace(/\s/g, '-');
    d.onclick = () => pickFont(f.id);
    d.innerHTML = `
      <div class="fprev" style="font-family:'${f.id}',cursive">${f.sample}</div>
      <div class="fname">${f.label}</div>`;
    fg.appendChild(d);
  });
}

function pickFont(id) {
  CFG.font = id;
  document.querySelectorAll('.fc').forEach(c => c.classList.remove('sel'));
  document.getElementById('fc-' + id.replace(/\s/g, '-')).classList.add('sel');
  refreshMiniPreview();
  scheduleSave?.();
}

// ── Shape style ──────────────────────────────────────────────────
function pickShape(s) {
  CFG.shape = s;
  document.getElementById('sh-curved').classList.toggle('sel', s === 'curved');
  document.getElementById('sh-angular').classList.toggle('sel', s === 'angular');
  refreshMiniPreview();
  scheduleSave?.();
}

// ── Page background style ────────────────────────────────────────
const PAGE_BG_OPTIONS = [
  { id: 'default', label: 'Default',  desc: 'Blob accents only' },
  { id: 'dots',    label: 'Dots',     desc: 'Subtle dot pattern' },
  { id: 'stripes', label: 'Stripes',  desc: 'Diagonal stripes' },
  { id: 'solid',   label: 'Tinted',   desc: 'Light solid fill' },
];

function _buildPageBgSection() {
  const grid = document.getElementById('pgBgGrid');
  if (!grid) return;
  PAGE_BG_OPTIONS.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'pgstyle-card' + (CFG.pageBg === opt.id ? ' sel' : '');
    card.dataset.style = opt.id;
    card.onclick = () => pickPageBg(opt.id);
    card.innerHTML = `
      <div class="pgstyle-demo pgstyle-demo-${opt.id}"></div>
      <div class="pgstyle-label">${opt.label}</div>
      <div class="pgstyle-desc">${opt.desc}</div>`;
    grid.appendChild(card);
  });
}

function pickPageBg(style) {
  CFG.pageBg = style;
  document.querySelectorAll('.pgstyle-card').forEach(c => {
    c.classList.toggle('sel', c.dataset.style === style);
  });
  refreshMiniPreview();
  scheduleSave?.();
}

// ── Live mini-preview ────────────────────────────────────────────
function refreshMiniPreview() {
  const inner = document.getElementById('miniPreviewInner');
  if (!inner) return;
  inner.innerHTML = '';
  // makeFront accepts null pg for preview-only rendering (no sticker layer)
  const el = makeFront(null);
  inner.appendChild(el);
}

// ── Custom sticker upload ────────────────────────────────────────
function addCustomStickers(input) {
  Array.from(input.files).forEach(f => {
    const r = new FileReader();
    r.onload = e => {
      const i = CFG.customStickers.length;
      CFG.customStickers.push({ name: f.name, url: e.target.result });
      _renderStickerThumb(i, e.target.result);
      rebuildStickerBar?.();
      scheduleSave?.();
    };
    r.readAsDataURL(f);
  });
  input.value = '';
}

function _renderStickerThumb(i, url) {
  const area = document.getElementById('stkArea');
  const t = document.createElement('div');
  t.className = 'cst';
  t.id = 'cst-' + i;
  t.innerHTML = `<img src="${url}"><div class="del" onclick="removeCustomSticker(${i})">×</div>`;
  area.insertBefore(t, area.children[0]);
}

function removeCustomSticker(i) {
  CFG.customStickers.splice(i, 1);
  document.getElementById('cst-' + i)?.remove();
  rebuildStickerBar?.();
  scheduleSave?.();
}
