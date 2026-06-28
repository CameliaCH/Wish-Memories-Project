/**
 * export.js
 * Exports the entire photobook as a multi-page PDF (8 × 8 inch per page).
 * Uses html-to-image (primary) + jsPDF.
 * Text stickers injected as DOM elements before capture so html-to-image
 * renders them with the correct Google Web Font via Chrome's CSS engine.
 * Image stickers drawn directly on canvas after capture — bypasses the
 * SVG-foreignObject rendering bug that affects html-to-image in Chrome.
 */

const PDF_MM   = 203.2;  // 8 inches in mm
const BLEED_MM = 6.35;   // 0.25 inch bleed per side
const MARK_LEN = 4;      // crop mark length (mm)
const MARK_GAP = 1.5;    // gap between crop mark and image edge (mm)

const SINGLE_TYPES   = ['cover', 'back'];
const COVER_TYPES    = ['cover', 'back'];
const CONTENT_TYPES  = ['info-spread', 'sa', 'sb', 'sc', 'sd'];

// ── Public export entry points ────────────────────────────────────
async function exportCoverPages() {
  await _runExport(COVER_TYPES, 'cover');
}

async function exportContentPages() {
  await _runExport(CONTENT_TYPES, 'content');
}

// ── Shared export core ────────────────────────────────────────────
async function _runExport(typeFilter, fileSuffix) {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    alert('Export libraries are still loading — please wait a moment and try again.');
    return;
  }

  const { jsPDF }     = window.jspdf;
  const withCropMarks = document.getElementById('cropMarksChk')?.checked ?? false;
  const pageSize      = withCropMarks ? PDF_MM + BLEED_MM * 2 : PDF_MM;
  const imgOffset     = withCropMarks ? BLEED_MM : 0;

  const queue = _buildExportQueue(typeFilter);
  if (!queue.length) { alert('No pages to export.'); return; }
  const total = queue.length;

  _showProgress(0, total, 'Preparing…');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit:        'mm',
    format:      [pageSize, pageSize],
  });

  const container = document.getElementById('exportRoot');

  for (let i = 0; i < queue.length; i++) {
    const { pg, side, label } = queue[i];
    _updateProgress(i, total, `Rendering ${label}…`);

    if (i > 0) pdf.addPage([pageSize, pageSize]);

    try {
      const pageEl   = _buildSinglePageEl(pg, side);
      const layerKey = side ? pg.id + '-' + side : pg.id;

      container.innerHTML = '';
      container.appendChild(pageEl);

      await _injectAllStickers(pageEl, layerKey);
      await _prerenderPhotos(pageEl);
      try { await document.fonts.ready; } catch(e) {}
      await _wait(200);

      const canvas = await _pageToCanvas(pageEl);

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.99),
                   'JPEG', imgOffset, imgOffset, PDF_MM, PDF_MM);
      if (withCropMarks) _drawCropMarks(pdf, imgOffset);

    } catch (err) {
      console.error('Export error on', label, ':', err);
    }
  }

  container.innerHTML = '';
  _hideProgress();

  const base = (nm() || 'photobook').replace(/[^a-z0-9]/gi, '_');
  pdf.save(`${base}_wish_journey_${fileSuffix}.pdf`);

  setTimeout(showSuccess, 600);
}

// ── Export queue ──────────────────────────────────────────────────
function _buildExportQueue(typeFilter) {
  const queue = [];
  PAGES.forEach(pg => {
    if (typeFilter && !typeFilter.includes(pg.type)) return;
    if (SINGLE_TYPES.includes(pg.type)) {
      queue.push({ pg, side: null, label: pg.label });
    } else {
      queue.push({ pg, side: 'L', label: pg.label + ' (left)'  });
      queue.push({ pg, side: 'R', label: pg.label + ' (right)' });
    }
  });
  return queue;
}

// ── Single-page element builder ───────────────────────────────────
function _buildSinglePageEl(pg, side) {
  if (!side) return buildPage(pg);

  if (pg.type === 'info-spread') {
    const spread   = makeInfoSpread(pg);
    const children = spread.querySelectorAll('.sp');
    const target   = children[side === 'L' ? 0 : 1];
    if (target) { target.style.width = '560px'; target.style.height = '560px'; return target; }
    return spread;
  }

  const layoutIdx = { sa: 0, sb: 1, sc: 2, sd: 3 }[pg.type];
  return makeSpPage(pg, pg.id + '-' + side, side, layoutIdx, LC[layoutIdx]);
}

// ── Render page HTML → canvas ─────────────────────────────────────
// html-to-image uses Chrome's actual CSS engine via SVG foreignObject, which
// correctly renders organic border-radius blobs, clip-path shapes, etc.
// Wrapped in a 15-second timeout so it can't hang if font fetching stalls.
// html2canvas is the fallback: always completes, slightly less CSS-accurate.
async function _pageToCanvas(el) {
  await _ensureExportFontsLoaded();
  const fontEmbedCSS = await _getGoogleFontsEmbedCSS();

  if (typeof htmlToImage !== 'undefined') {
    try {
      return await Promise.race([
        htmlToImage.toCanvas(el, {
          pixelRatio:      4,
          backgroundColor: '#FFFAF5',
          cacheBust:       false,
          skipFonts:       false,
          fontEmbedCSS,        // <-- inline base64 @font-face rules so SVG renders with correct fonts
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('html-to-image timeout')), 20000)
        ),
      ]);
    } catch(e) {
      console.warn('html-to-image failed or timed out, falling back to html2canvas:', e.message);
    }
  }
  return html2canvas(el, {
    scale:        4,
    useCORS:      true,
    allowTaint:   true,
    backgroundColor: '#FFFAF5',
    logging:      false,
    width:        560,
    height:       560,
    windowWidth:  560,
    windowHeight: 560,
  });
}

async function _ensureExportFontsLoaded() {
  const fontNames = Array.from(new Set(
    FONTS.map(f => f.id).concat(['Nunito', 'Baloo 2', 'Bangers', 'Fredoka One', 'Righteous'])
  ));
  const weights = ['400', '700', '800', '900'];
  await Promise.all(fontNames.flatMap(name =>
    weights.map(async weight => {
      try {
        await document.fonts.load(`${weight} 16px "${name}"`);
      } catch (err) {
        console.warn('Export font load failed for', name, weight, err);
      }
    })
  ));
  try { await document.fonts.ready; } catch (e) {}
}

// ── Embed Google Fonts as inline base64 @font-face rules ──────────
// html-to-image rasterises via SVG <foreignObject>; Chrome's SVG renderer
// only uses web fonts embedded inline in the SVG (base64 data URLs).
// The Google Fonts stylesheet is cross-origin, so html-to-image's own auto-
// embed silently fails (can't read cssRules). We fetch + inline manually.
let _fontEmbedCache = null;
async function _getGoogleFontsEmbedCSS() {
  if (_fontEmbedCache !== null) return _fontEmbedCache;

  // Match the <link> in index.html exactly
  const GF_URL =
    'https://fonts.googleapis.com/css2' +
    '?family=Baloo+2:wght@400;700;800' +
    '&family=Bangers' +
    '&family=Fredoka+One' +
    '&family=Righteous' +
    '&family=Nunito:wght@400;700;900' +
    '&display=swap';

  try {
    // Fetch the CSS text (Google returns woff2 @font-face rules for modern browsers)
    const cssText = await fetch(GF_URL, { credentials: 'omit' }).then(r => r.text());

    // Find every font file URL inside url(...) — these live on fonts.gstatic.com (CORS-enabled)
    const urls = Array.from(new Set(
      [...cssText.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/["']/g, '').trim())
    ));

    // Fetch every font file and convert to base64 data URL in parallel
    const pairs = await Promise.all(urls.map(async u => {
      try {
        const blob = await fetch(u, { credentials: 'omit' }).then(r => r.blob());
        const dataUrl = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload  = () => resolve(fr.result);
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        });
        return [u, dataUrl];
      } catch (err) {
        console.warn('Failed to fetch font file for embedding:', u, err);
        return [u, null];
      }
    }));

    // Replace every original URL with its base64 data URL in the CSS
    let embedded = cssText;
    for (const [u, d] of pairs) {
      if (!d) continue;
      // Escape regex special chars in URL
      const safe = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      embedded = embedded.replace(new RegExp(safe, 'g'), d);
    }

    _fontEmbedCache = embedded;
    return embedded;
  } catch (err) {
    console.warn('Could not build Google Fonts embed CSS; PDF may use fallback fonts:', err);
    _fontEmbedCache = '';
    return '';
  }
}

// ── Inject all stickers into DOM before capture (correct z-order) ──
// Text: injected as styled DOM elements so html-to-image uses the real
//   CSS engine for Google Web Font rendering (canvas 2D is unreliable).
// Image: pre-rasterised to PNG via canvas first, then injected as <img>.
//   SVG data URLs are silently dropped by Chrome's SVG foreignObject
//   renderer, so converting to PNG avoids blank stickers in the PDF.
async function _injectAllStickers(pageEl, layerKey) {
  const items = sstore[layerKey];
  if (!items || !items.length) return;
  const layer = pageEl.querySelector('.sticklayer');
  if (!layer) return;

  for (const item of items) {
    try {
      if (item.type === 'text') {
        const wrap = document.createElement('div');
        wrap.style.cssText =
          `position:absolute;left:${item.x}px;top:${item.y}px;` +
          `transform:rotate(${item.rotation || 0}deg);transform-origin:0 0;` +
          `pointer-events:none;z-index:20;`;
        const fontFamily = item.fontFamily || CFG.font || 'sans-serif';
        const fallback = ['Nunito', 'sans-serif', 'Arial', 'Helvetica'].includes(fontFamily)
          ? 'sans-serif' : 'cursive';
        const t = document.createElement('div');
        t.style.cssText =
          `font-family:'${fontFamily}',${fallback};` +
          `font-size:${item.fontSize || 16}px;` +
          `color:${item.color || '#000000'};` +
          `font-weight:${item.bold ? '800' : '400'};` +
          `font-style:${item.italic ? 'italic' : 'normal'};` +
          `text-decoration:${item.underline ? 'underline' : 'none'};` +
          `text-align:${item.align || 'left'};` +
          `white-space:pre;line-height:1.3;` +
          `padding:2px 7px 2px 5px;background:transparent;`;
        t.innerHTML = (item.text || '').replace(/<div>/gi, '<br>').replace(/<\/div>/gi, '');
        wrap.appendChild(t);
        layer.appendChild(wrap);

      } else if (item.type === 'img') {
        const sz     = item.size || 80;
        const pngSrc = await _stickerToPng(item.src, sz);
        if (!pngSrc) continue;
        const wrap = document.createElement('div');
        wrap.style.cssText =
          `position:absolute;left:${item.x}px;top:${item.y}px;` +
          `width:${sz}px;height:${sz}px;` +
          `transform:rotate(${item.rotation || 0}deg);transform-origin:0 0;` +
          `pointer-events:none;z-index:20;`;
        const img = document.createElement('img');
        img.src            = pngSrc;
        img.style.cssText  = 'width:100%;height:100%;object-fit:contain;display:block;';
        img.crossOrigin    = 'anonymous';
        wrap.appendChild(img);
        layer.appendChild(wrap);
      }
    } catch (e) {
      console.warn('Sticker inject error:', e, item);
    }
  }
}

// ── Rasterise a sticker image (any format) to a PNG data URL ──────
// Draws the source image onto an offscreen canvas at 4× the display size
// so html-to-image captures it at full PDF resolution.
async function _stickerToPng(src, displaySize) {
  if (!src) return null;
  const img = await new Promise(res => {
    const tmp = new Image();
    tmp.onload  = () => res(tmp);
    tmp.onerror = () => res(null);
    tmp.src = src;
  });
  if (!img) return null;
  const px  = displaySize * 4;   // match html-to-image's pixelRatio:4
  const c   = document.createElement('canvas');
  c.width   = px;
  c.height  = px;
  c.getContext('2d').drawImage(img, 0, 0, px, px);
  return c.toDataURL('image/png');
}

// ── Draw image stickers only onto the canvas ──────────────────────
// Text stickers are already captured via DOM injection above.
async function _drawImgStickersOnly(canvas, key, scale) {
  const items = sstore[key];
  if (!items || !items.length) return;
  const ctx = canvas.getContext('2d');
  for (const item of items) {
    if (item.type === 'img') await _drawImgSticker(ctx, item, scale);
  }
}

// ── Draw all stickers in z-order ──────────────────────────────────
// Single ordered pass: each sticker drawn in the order it was added
// (first = bottom, last = top), so the editor's visual stack is preserved.
// Images use canvas drawImage; text uses canvas 2D with pre-loaded fonts.
// Each sticker is isolated in try/catch so one bad item can't drop others.
async function _drawStickersInOrder(canvas, key, scale) {
  const items = sstore[key];
  if (!items || !items.length) return canvas;

  const ctx = canvas.getContext('2d');
  for (const item of items) {
    try {
      if (item.type === 'img') {
        await _drawImgSticker(ctx, item, scale);
      } else if (item.type === 'text') {
        _drawTextStickerOnCanvas(ctx, item, scale);
      }
    } catch (e) {
      console.warn('Sticker draw error:', e, item);
    }
  }
  return canvas;
}

// ── Render a text sticker onto a canvas 2D context ────────────────
// Fonts are pre-loaded by _ensureExportFontsLoaded before capture.
function _drawTextStickerOnCanvas(ctx, item, scale) {
  const x       = item.x * scale;
  const y       = item.y * scale;
  const fs      = (item.fontSize || 16) * scale;
  const fam     = item.fontFamily || CFG?.font || 'Nunito';
  const weight  = item.bold   ? '800' : '400';
  const fstyle  = item.italic ? 'italic ' : '';
  const align   = item.align  || 'left';
  // Match the 5px left / 2px top padding used in _injectTextStickers
  const padL    = 5 * scale;
  const padT    = 2 * scale;
  const lineH   = fs * 1.3;

  // Normalise contentEditable HTML → plain text with \n line breaks
  const plain = (item.text || '')
    .replace(/<div>/gi,    '\n').replace(/<\/div>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g,  '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<')
    .replace(/&gt;/g,   '>').replace(/&amp;/g, '&');
  const lines = plain.split('\n');

  ctx.save();
  ctx.translate(x + padL, y + padT);
  ctx.rotate((item.rotation || 0) * Math.PI / 180);
  ctx.font         = `${fstyle}${weight} ${fs}px '${fam}', sans-serif`;
  ctx.fillStyle    = item.color || '#000000';
  ctx.textBaseline = 'top';
  ctx.textAlign    = align;

  lines.forEach((line, i) => {
    ctx.fillText(line, 0, i * lineH);
    if (item.underline) {
      const w  = ctx.measureText(line).width;
      const tx = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
      ctx.fillRect(tx, i * lineH + fs * 1.05, w, Math.max(1, fs * 0.07));
    }
  });

  ctx.restore();
}

async function _drawImgSticker(ctx, item, scale) {
  if (!item.src) return;
  const img = await new Promise(res => {
    const tmp = new Image();
    tmp.onload  = () => res(tmp);
    tmp.onerror = () => res(null);
    tmp.src = item.src;
  });
  if (!img) return;

  const sz  = (item.size || 80) * scale;
  const cx  = item.x * scale + sz / 2;
  const cy  = item.y * scale + sz / 2;
  const rot = (item.rotation || 0) * Math.PI / 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
  ctx.restore();
}

// ── Pre-render CSS background-image photos at export resolution ───
// Converts each background-image: url(...) to a pre-drawn canvas data URL
// so html2canvas receives pixel-perfect input instead of re-scaling.
async function _prerenderPhotos(pageEl) {
  const SCALE = 6;
  const divs  = Array.from(pageEl.querySelectorAll('[style*="background-image"]'));
  await Promise.all(divs.map(async div => {
    const bg = div.style.backgroundImage;
    if (!bg || bg === 'none') return;

    const m = bg.match(/url\("([^"]+)"\)|url\('([^']+)'\)|url\(([^)]+)\)/);
    if (!m) return;
    const url = (m[1] || m[2] || m[3]).trim();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) return; // skip non-data URLs

    const bgSize = div.style.backgroundSize     || 'cover';
    const bgPos  = div.style.backgroundPosition || '50% 50%';
    const W = div.offsetWidth  || div.parentElement?.offsetWidth  || 512;
    const H = div.offsetHeight || div.parentElement?.offsetHeight || 512;
    if (!W || !H) return;

    const img = await new Promise(res => {
      const i = new Image();
      i.onload = () => res(i); i.onerror = () => res(null); i.src = url;
    });
    if (!img || !img.naturalWidth) return;

    const c   = document.createElement('canvas');
    c.width   = W * SCALE;
    c.height  = H * SCALE;
    const ctx = c.getContext('2d');

    const ir  = img.naturalWidth / img.naturalHeight;
    const pct = parseFloat(bgSize);
    let dW, dH;
    if (!isNaN(pct) && bgSize.includes('%')) {
      dW = W * (pct / 100) * SCALE; dH = dW / ir;
    } else {
      const br = W / H;
      if (ir > br) { dH = H * SCALE; dW = dH * ir; }
      else          { dW = W * SCALE; dH = dW / ir; }
    }

    const parts = bgPos.split(/\s+/);
    const ox = parseFloat(parts[0]) || 50;
    const oy = parseFloat(parts[1] ?? parts[0]) || 50;
    ctx.drawImage(img, (W * SCALE - dW) * (ox / 100), (H * SCALE - dH) * (oy / 100), dW, dH);

    div.style.backgroundImage    = `url(${c.toDataURL('image/jpeg', 0.99)})`;
    div.style.backgroundSize     = '100% 100%';
    div.style.backgroundPosition = '0 0';
  }));
}

// ── Crop marks ────────────────────────────────────────────────────
function _drawCropMarks(pdf, o) {
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.2);
  const e = o + PDF_MM, g = MARK_GAP, ml = MARK_LEN;
  pdf.line(0,    o,     o - g,     o    ); pdf.line(o,    0,     o,         o - g  );
  pdf.line(e+g,  o,     e+g+ml,    o    ); pdf.line(e,    0,     e,         o - g  );
  pdf.line(0,    e,     o - g,     e    ); pdf.line(o,    e+g,   o,         e+g+ml );
  pdf.line(e+g,  e,     e+g+ml,    e    ); pdf.line(e,    e+g,   e,         e+g+ml );
}

// ── Progress toast ────────────────────────────────────────────────
function _showProgress(done, total, msg) {
  const t = document.getElementById('exportToast');
  if (t) t.style.display = 'block';
  _updateProgress(done, total, msg);
}
function _updateProgress(done, total, msg) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const m = document.getElementById('exportMsg');
  const b = document.getElementById('exportBar');
  if (m) m.textContent = msg;
  if (b) b.style.width = pct + '%';
}
function _hideProgress() {
  const t = document.getElementById('exportToast');
  if (t) t.style.display = 'none';
}
function _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Success modal ─────────────────────────────────────────────────
function showSuccess() {
  const ov = document.getElementById('successOverlay');
  if (ov) ov.style.display = 'flex';
}
function closeSuccess() {
  const ov = document.getElementById('successOverlay');
  if (ov) ov.style.display = 'none';
}