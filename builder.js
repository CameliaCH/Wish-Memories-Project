/**
 * builder.js
 * Constructs DOM elements for every page type.
 * Returns a detached DOM node ready to be appended to the canvas or export container.
 * Depends on: config.js, helpers.js, stickers.js
 */

// ── Page background overlay ───────────────────────────────────────
/**
 * Returns an optional full-bleed pattern overlay div based on CFG.pageBg.
 * Injected as the first child so it sits behind blobs and content.
 */
function _pageBgOverlay() {
  if (!CFG.pageBg || CFG.pageBg === 'default') return '';
  let bgStyle = '';
  if (CFG.pageBg === 'dots') {
    bgStyle = `background-image:radial-gradient(circle,${c0()}30 1.5px,transparent 1.5px);background-size:18px 18px`;
  } else if (CFG.pageBg === 'stripes') {
    bgStyle = `background-image:repeating-linear-gradient(45deg,${c0()}22 0,${c0()}22 2px,transparent 0,transparent 50%);background-size:12px 12px`;
  } else if (CFG.pageBg === 'solid') {
    bgStyle = `background:${c4()};opacity:.14`;
  }
  return `<div style="position:absolute;inset:0;z-index:0;pointer-events:none;${bgStyle}"></div>`;
}

// ── FRONT COVER ──────────────────────────────────────────────────
function makeFront(pg) {
  blobIdx = 0;
  const d = document.createElement('div');
  d.className = 'pc'; d.id = pg ? pg.id : 'front';

  const gradBg = `linear-gradient(145deg,${c0()}1A 0%,${c2()}1A 60%,${c4()}1A 100%)`;

  d.innerHTML = `
    ${_pageBgOverlay()}
    <div style="position:absolute;inset:0;background:${gradBg}"></div>
    <div style="position:absolute;top:-60px;left:-60px;width:310px;height:280px;background:${c0()};${blobStyle('60% 40% 50% 70%/50% 60% 40% 60%')};opacity:.16"></div>
    <div style="position:absolute;bottom:-40px;right:-40px;width:250px;height:230px;background:${c1()};${blobStyle('40% 60% 70% 30%/60% 40% 70% 50%')};opacity:.13"></div>
    ${starDeco('28px',  '30px',   24, c2(), .75)}
    ${starDeco('76px',  'auto',   14, c0(), .55, 'right:108px')}
    ${starDeco('auto',  '48px',   18, c4(), .65, 'bottom:134px')}
    ${starDeco('120px', 'auto',   10, c3(), .5,  'right:60px')}

    <!-- Age badge -->
    <div style="position:absolute;top:34px;right:30px;width:62px;height:62px;
                background:${c1()};border-radius:50%;display:flex;flex-direction:column;
                align-items:center;justify-content:center;z-index:3">
      <span style="font-family:${fam()};font-size:24px;font-weight:800;color:${c2()};line-height:1">${ag()}</span>
      <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,.62);letter-spacing:1px;text-transform:uppercase">years</span>
    </div>

    <!-- Main content -->
    <div style="position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;padding:36px 34px 28px">
      <div style="background:${c0()};color:#fff;font-family:${fam()};font-size:11px;font-weight:700;
                  letter-spacing:3px;text-transform:uppercase;padding:5px 16px;
                  border-radius:${br(20)};margin-bottom:14px;white-space:nowrap">✦ Make-A-Wish Malaysia ✦</div>

      <div style="font-family:${fam()};font-size:56px;font-weight:800;color:${c1()};line-height:1;text-align:center">
        ${nmPoss().toUpperCase()}
      </div>
      <div style="font-family:${fam()};font-size:22px;font-weight:700;color:${c0()};margin-top:8px;letter-spacing:1px">
        Wish Journey
      </div>

      ${coverFrameHTML()}

      <div style="background:${c2()};color:${c1()};font-family:${fam()};font-size:13px;font-weight:700;
                  padding:8px 20px;border-radius:${br(30)};margin-top:30px;text-align:center;
                  white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis">
        ⭐ ${wsh()}
      </div>
    </div>
    ${sz()}${pg ? sl(pg.id) : ''}`;

  return d;
}

// ── BACK COVER ───────────────────────────────────────────────────
function makeBack(pg) {
  blobIdx = 0;
  const d = document.createElement('div');
  d.className = 'pc'; d.id = pg.id;

  d.innerHTML = `
    ${_pageBgOverlay()}
    <div style="position:absolute;inset:0;background:${c1()}"></div>
    <div style="position:absolute;top:-70px;right:-70px;width:280px;height:260px;
                background:${c0()};${blobStyle('50% 40% 60% 40%')};opacity:.28"></div>
    <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.05) 1px,transparent 1px);
                background-size:20px 20px;z-index:0"></div>
    <div style="position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:20px;padding:48px">
      <div style="font-size:66px">💛</div>
      <div style="font-family:${fam()};font-size:28px;font-weight:800;color:${c2()};text-align:center;line-height:1.25">
        Stay Strong,<br>${nm()}!
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,.72);text-align:center;line-height:1.85;max-width:370px">
        Keep believing and never give up.
        We are cheering for you every step of the way.
      </div>
      <div style="display:flex;gap:7px;font-size:17px">⭐⭐⭐⭐⭐</div>
      <div style="background:rgba(255,255,255,.1);color:rgba(255,255,255,.78);
                  font-family:${fam()};font-size:12px;font-weight:700;letter-spacing:3px;
                  padding:8px 22px;border-radius:${br(20)};border:1px solid rgba(255,255,255,.18)">
        MAKE-A-WISH MALAYSIA
      </div>
    </div>
    ${sz()}${sl(pg.id)}`;

  return d;
}


// ── INNER SPREAD ─────────────────────────────────────────────────

/**
 * Default frame positions for 1, 2, or 3 frames on a 560×560 page.
 * Each frame: { x, y, w, h } in pixels.
 */
const FRAME_DEFAULTS = {
  0: [],
  1: [{ x:24, y:24, w:512, h:512 }],
  2: [
    { x:24, y:24,  w:512, h:252 },
    { x:24, y:284, w:512, h:252 },
  ],
  3: [
    { x:24, y:24,  w:512, h:165 },
    { x:24, y:197, w:512, h:165 },
    { x:24, y:370, w:512, h:166 },
  ],
};

/** Returns frames array for a key, initialising defaults on first access. */
function _getFrames(key, defaultCount) {
  if (!pageFrames[key]) {
    const tpl = FRAME_DEFAULTS[defaultCount] || FRAME_DEFAULTS[2];
    pageFrames[key] = tpl.map(f => ({ ...f }));
  }
  return pageFrames[key];
}

/** Builds one resizable/draggable photo frame element as an HTML string. */
function _frameHTML(key, idx, frame) {
  const sid = key + '-' + idx;
  const data = _imgData(imgs[sid]);
  const r = CFG.shape === 'angular' ? `clip-path:${OCT_CLIP};border-radius:0` : `border-radius:${br(12)}`;

  let photoHTML;
  if (data) {
    const bsize = data.zoom > 1 ? (data.zoom * 100) + '%' : 'cover';
    photoHTML = `<div style="position:absolute;inset:0;cursor:grab;
      background-image:url('${data.url}');background-size:${bsize};
      background-position:${data.ox}% ${data.oy}%;background-repeat:no-repeat"
      onmousedown="startPhotoPan(event,this,'${sid}')"></div>`;
  } else {
    photoHTML = `<div class="phi" onclick="upload('${sid}')">
      <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
        <rect x="6" y="10" width="36" height="28" rx="3" stroke="#ccc" stroke-width="2" fill="none"/>
        <circle cx="24" cy="24" r="7" stroke="#ccc" stroke-width="2" fill="none"/>
        <circle cx="35" cy="15" r="2" fill="#ccc"/>
      </svg>
      <span>Add Photo</span>
    </div>`;
  }

  return `<div class="sp-frame"
    style="position:absolute;left:${frame.x}px;top:${frame.y}px;width:${frame.w}px;height:${frame.h}px">
    <div class="sp-frame-inner" style="${r}">${photoHTML}</div>
    <div class="fr-drag-grip no-export" onmousedown="startFrameDrag(event,this,'${key}',${idx})" title="Drag to move frame">
      <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
        <circle cx="4" cy="2" r="1.5"/><circle cx="10" cy="2" r="1.5"/>
        <circle cx="4" cy="5" r="1.5"/><circle cx="10" cy="5" r="1.5"/>
        <circle cx="4" cy="8" r="1.5"/><circle cx="10" cy="8" r="1.5"/>
      </svg>
    </div>
    <div class="fr-handle fr-nw no-export" onmousedown="startFrameResize(event,this,'${key}',${idx},'nw')"></div>
    <div class="fr-handle fr-ne no-export" onmousedown="startFrameResize(event,this,'${key}',${idx},'ne')"></div>
    <div class="fr-handle fr-sw no-export" onmousedown="startFrameResize(event,this,'${key}',${idx},'sw')"></div>
    <div class="fr-handle fr-se no-export" onmousedown="startFrameResize(event,this,'${key}',${idx},'se')"></div>
  </div>`;
}

function _frameCountBtn(key) {
  const count = pageFrames[key]?.length ?? 2;
  const label = count === 0 ? 'Blank' : `${count} Frame${count > 1 ? 's' : ''}`;
  return `<div class="layout-pick-btn no-export"
    onclick="openLayoutPicker('${key}')"
    title="Change layout">⊞ ${label}</div>`;
}

function makeSpread(pg, layoutIdx) {
  const w = document.createElement('div');
  w.className = 'psp'; w.id = pg.id;
  const lk = pg.id + '-L';
  const rk = pg.id + '-R';
  const lc = LC[layoutIdx];
  w.appendChild(makeSpPage(pg, lk, 'L', layoutIdx, lc));
  w.appendChild(makeSpPage(pg, rk, 'R', layoutIdx, lc));
  return w;
}

function makeSpPage(pg, key, side, layoutIdx, lc) {
  blobIdx = side === 'L' ? layoutIdx * 2 : layoutIdx * 2 + 8;

  const d = document.createElement('div');
  d.className = 'sp';
  const pgIdx  = PAGES.indexOf(pg);
  const pn     = side === 'L' ? (pgIdx - 1) * 2 + 1 : (pgIdx - 1) * 2 + 2;
  const b1     = lc.b1();
  const bStyle = blobStyle('50% 40% 60% 40%');
  const bgOv   = _pageBgOverlay();
  const isL    = side === 'L';
  // Alternate diagonal direction by layout type for visual variety
  const flipDiag = layoutIdx % 2 === 1;
  const bp     = flipDiag
    ? (isL ? 'top:-40px;right:-40px'    : 'bottom:-30px;left:-30px')
    : (isL ? 'top:-40px;left:-40px'     : 'bottom:-30px;right:-30px');
  const bp2    = flipDiag
    ? (isL ? 'bottom:-30px;left:-30px'  : 'top:-40px;right:-40px')
    : (isL ? 'bottom:-30px;right:-30px' : 'top:-40px;left:-40px');
  const bStyle2 = blobStyle('40% 60% 55% 50%');
  const b2     = lc.b2();
  const blob   =
    `<div style="position:absolute;${bp};width:200px;height:180px;background:${b1};${bStyle};opacity:.3;z-index:0"></div>` +
    `<div style="position:absolute;${bp2};width:150px;height:130px;background:${b2};${bStyle2};opacity:.22;z-index:0"></div>`;
  const pgl    = `<div class="pgn ${isL ? 'pgl' : 'pgr'}">${pn}</div>`;

  // Default count varies by spread type: sc→3, others→2
  const defaultCount = layoutIdx === 2 ? 3 : 2;
  const frames = _getFrames(key, defaultCount);
  const framesHTML = frames.map((f, i) => _frameHTML(key, i, f)).join('');

  d.innerHTML = bgOv + blob + framesHTML + pgl + _frameCountBtn(key) + sz() + sl(key);
  setupDropzone(d, key);
  return d;
}

// ── INFO SPREAD (Pages 1–2): description left | photo page right ──
function makeInfoSpread(pg) {
  blobIdx = 0;
  const wrap = document.createElement('div');
  wrap.className = 'psp'; wrap.id = pg.id;

  const bgOv = _pageBgOverlay();

  // ── LEFT PAGE: child description ─────────────────────────────
  const lKey = pg.id + '-L';
  const left  = document.createElement('div');
  left.className = 'sp';

  left.innerHTML = `
    ${bgOv}
    <div style="position:absolute;top:-40px;right:-40px;width:160px;height:145px;
                background:${c3()};${blobStyle('40% 60% 60% 40%/50% 50% 70% 40%')};opacity:.3;z-index:0"></div>
    <div style="position:absolute;bottom:-40px;left:-40px;width:200px;height:180px;
                background:${c4()};${blobStyle('60% 40% 40% 60%/60% 50% 60% 40%')};opacity:.35;z-index:0"></div>

    <div style="position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;padding:46px 40px">
      <div style="font-family:${fam()};font-size:11px;font-weight:700;letter-spacing:3px;
                  color:${c0()};text-transform:uppercase;margin-bottom:7px">Our Hero</div>

      <div style="font-family:${fam()};font-size:46px;font-weight:800;color:${c1()};line-height:1">
        ${nm()}
      </div>

      <div style="display:flex;gap:9px;margin-top:14px;flex-wrap:wrap">
        <div style="background:${c2()};color:${c1()};font-family:${fam()};font-size:13px;font-weight:700;
                    padding:6px 15px;border-radius:${br(20)}">Age ${ag()}</div>
        <div style="background:${c1()};color:#fff;font-family:${fam()};font-size:13px;font-weight:700;
                    padding:6px 15px;border-radius:${br(20)}">Wish Journey</div>
      </div>

      <div style="margin-top:20px;background:${c0()}18;border-left:4px solid ${c0()};
                  border-radius:0 ${br(10)} ${br(10)} 0;padding:13px 16px">
        <div style="font-family:${fam()};font-size:10px;font-weight:700;color:${c0()};
                    letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">✦ The Wish</div>
        <div style="font-size:13px;color:${c1()};font-weight:700;line-height:1.65">${wsh()}</div>
      </div>

      <!-- Photo slot fills remaining space -->
      <div style="margin-top:18px;flex:1;min-height:0">
        ${ps('info-photo',
          'position:relative;width:100%;height:100%;min-height:100px;border-radius:'+br(10)+';overflow:hidden;z-index:1')}
      </div>

      <div style="margin-top:12px;font-size:10px;color:#aaa;line-height:1.8">
        This photobook captures the magic of
        <strong style="color:${c1()}">${nmPoss()}</strong> wish journey
        granted by Make-A-Wish Malaysia.
      </div>
    </div>
    <div class="pgn pgl">1</div>
    ${sz()}${sl(lKey)}`;

  setupDropzone(left, lKey);

  // ── RIGHT PAGE: standard photo page ──────────────────────────
  blobIdx = 4;
  const rKey  = pg.id + '-R';
  const right = document.createElement('div');
  right.className = 'sp';

  const b1 = CFG.colors[3];
  const b2 = CFG.colors[4];

  right.innerHTML = `
    ${bgOv}
    <div style="position:absolute;top:-40px;left:-40px;width:220px;height:200px;
                background:${b1};${blobStyle('50% 40% 60% 40%')};opacity:.35;z-index:0"></div>
    ${ps(rKey + '-big',
      'position:absolute;top:28px;left:28px;right:28px;bottom:76px;border-radius:'+br(14)+';z-index:1')}
    <div style="position:absolute;bottom:22px;left:28px;right:28px;z-index:2">
      <span style="display:inline-block;background:${b1};color:${c1()};
             font-family:${fam()};font-size:13px;font-weight:700;
             padding:5px 15px;border-radius:${br(20)};opacity:.92">My Story</span>
    </div>
    <div class="pgn pgr">2</div>
    ${sz()}${sl(rKey)}`;

  setupDropzone(right, rKey);

  wrap.appendChild(left);
  wrap.appendChild(right);
  return wrap;
}

// ── DISPATCHER ───────────────────────────────────────────────────
/**
 * Builds and returns the correct page element for the given PAGES entry.
 * @param {object} pg - entry from PAGES array
 * @returns {HTMLElement}
 */
function buildPage(pg) {
  switch (pg.type) {
    case 'cover': return makeFront(pg);
    case 'back':  return makeBack(pg);
    case 'info-spread': return makeInfoSpread(pg);
    default: {
      const li = { sa: 0, sb: 1, sc: 2, sd: 3 }[pg.type];
      return makeSpread(pg, li);
    }
  }
}