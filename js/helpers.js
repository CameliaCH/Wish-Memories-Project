/**
 * helpers.js
 * Pure utility functions — no side-effects on the DOM.
 * Depends on: config.js
 */

// ── Colour accessors ────────────────────────────────────────────
const c0 = () => CFG.colors[0];
const c1 = () => CFG.colors[1];
const c2 = () => CFG.colors[2];
const c3 = () => CFG.colors[3];
const c4 = () => CFG.colors[4];

// ── Font helpers ────────────────────────────────────────────────
const ff  = ()  => CFG.font;
const fam = ()  => `'${ff()}', cursive`;

// ── Input readers ───────────────────────────────────────────────
const nm  = () => document.getElementById('cName')?.value  || 'Alex';
const ag  = () => document.getElementById('cAge')?.value   || '?';
const wsh = () => document.getElementById('cWish')?.value  || '...';

/** Name with possessive apostrophe-s, e.g. "Alex" → "Alex's" */
const nmPoss = () => {
  const n = nm();
  return n.endsWith('s') || n.endsWith('S') ? `${n}'` : `${n}'s`;
};

// ── Shape helpers ────────────────────────────────────────────────

/** Returns a CSS border-radius string in curved mode, or '0px' in angular. */
const br = (px) => CFG.shape === 'curved' ? `${px}px` : '0px';

/**
 * Returns the CSS for a blob accent shape.
 * Curved: organic border-radius. Angular: cycles through ANGULAR_BLOBS.
 */
function blobStyle(curvedRadius) {
  if (CFG.shape === 'curved') return `border-radius:${curvedRadius};`;
  const clip = ANGULAR_BLOBS[blobIdx % ANGULAR_BLOBS.length];
  blobIdx++;
  return `clip-path:${clip}; border-radius:0;`;
}

/** Adds an octagon clip-path to inner photo slots in angular mode. */
function photoSlotStyle(base) {
  if (CFG.shape === 'angular') return `${base}; clip-path:${OCT_CLIP}`;
  return base;
}

// ── HTML fragment helpers ────────────────────────────────────────

/** Safe-zone placeholder — removed, kept as empty string for builder compatibility. */
const sz = () => '';

/** Sticker / text layer div for a given key. */
const sl = (k) => `<div class="sticklayer" id="sl-${k}"></div>`;

/**
 * Pill / tag element for spread captions.
 */
function pill(text, bgColor) {
  return `<span style="display:inline-block;background:${bgColor};color:${c1()};
    font-family:${fam()};font-size:13px;font-weight:700;
    padding:5px 15px;border-radius:${br(20)};opacity:.92">${text}</span>`;
}

/**
 * Returns { url, ox, oy, zoom } from an imgs slot value.
 * Handles both legacy plain strings and the new object format.
 */
function _imgData(stored) {
  if (!stored) return null;
  if (typeof stored === 'string') return { url: stored, ox: 50, oy: 50, zoom: 1 };
  return { url: stored.url, ox: stored.ox ?? 50, oy: stored.oy ?? 50, zoom: stored.zoom ?? 1 };
}

/**
 * Photo slot HTML. Clicking triggers an upload (empty) or crop modal (filled).
 * @param {string} sid   - slot id (key into imgs dict)
 * @param {string} style - CSS for position / size
 */
function ps(sid, style) {
  const stored    = imgs[sid];
  const slotStyle = photoSlotStyle(style);
  const data      = _imgData(stored);

  if (data) {
    const bsize = data.zoom > 1 ? (data.zoom * 100) + '%' : 'cover';
    return `<div style="${slotStyle};overflow:hidden;cursor:pointer;
                 background-image:url('${data.url}');
                 background-size:${bsize};
                 background-position:${data.ox}% ${data.oy}%;
                 background-repeat:no-repeat;"
                 onclick="openCropModal('${sid}')"></div>`;
  }

  return `<div style="${slotStyle};overflow:hidden;cursor:pointer" onclick="upload('${sid}')">
    <div class="phi" id="ph-${sid}">
      <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
        <rect x="6" y="10" width="36" height="28" rx="3" stroke="#ccc" stroke-width="2" fill="none"/>
        <circle cx="24" cy="24" r="7" stroke="#ccc" stroke-width="2" fill="none"/>
        <circle cx="35" cy="15" r="2" fill="#ccc"/>
      </svg>
      <span>Add Photo</span>
    </div>
  </div>`;
}

/**
 * Cover photo frame — curved = double-ring circle, angular = triple-ring starburst.
 */
function coverFrameHTML() {
  const fsz  = 214;
  const data = _imgData(imgs['cv-main']);

  let inner;
  if (data) {
    const bsize = data.zoom > 1 ? (data.zoom * 100) + '%' : 'cover';
    inner = `<div style="width:100%;height:100%;
               background-image:url('${data.url}');
               background-size:${bsize};
               background-position:${data.ox}% ${data.oy}%;
               background-repeat:no-repeat;cursor:pointer"
               onclick="openCropModal('cv-main')"></div>`;
  } else {
    inner = `<div class="phi" onclick="upload('cv-main')" style="cursor:pointer">
               <svg width="34" height="34" viewBox="0 0 48 48" fill="none">
                 <rect x="6" y="10" width="36" height="28" rx="3" stroke="#bbb" stroke-width="2" fill="none"/>
                 <circle cx="24" cy="24" r="8" stroke="#bbb" stroke-width="2" fill="none"/>
               </svg>
               <span>Add photo</span>
             </div>`;
  }

  if (CFG.shape === 'curved') {
    return `<div style="position:relative;margin-top:32px;width:${fsz}px;height:${fsz}px;flex-shrink:0">
      <div style="position:absolute;inset:-12px;border-radius:50%;background:${c3()}"></div>
      <div style="position:absolute;inset:-6px; border-radius:50%;background:#FFFAF5"></div>
      <div style="position:absolute;inset:0;border-radius:50%;border:4px solid ${c0()};
                  overflow:hidden;background:#f0f0f0">${inner}</div>
    </div>`;
  } else {
    return `<div style="position:relative;margin-top:32px;width:${fsz}px;height:${fsz}px;flex-shrink:0">
      <div style="position:absolute;inset:-20px;clip-path:${STAR_CLIP};background:${c3()}"></div>
      <div style="position:absolute;inset:-13px;clip-path:${STAR_CLIP};background:#FFFAF5"></div>
      <div style="position:absolute;inset:-6px; clip-path:${STAR_CLIP};background:${c0()}"></div>
      <div style="position:absolute;inset:0;    clip-path:${STAR_CLIP};
                  overflow:hidden;background:#f0f0f0">${inner}</div>
    </div>`;
  }
}

/**
 * Small star decoration element (used as cover background sparkles).
 */
function starDeco(top, left, size, col, opacity, extra = '') {
  return `<div style="position:absolute;top:${top};left:${left};
    width:${size}px;height:${size}px;background:${col};
    clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,
      50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
    opacity:${opacity};z-index:1;${extra}"></div>`;
}
