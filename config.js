/**
 * config.js
 * Global configuration, constants, and shared mutable state.
 * Loaded first — all other scripts depend on these.
 */

// ── User-adjustable design config ──────────────────────────────
const CFG = {
  colors: ['#B71C1C', '#1A3A5C', '#2B79D8', '#4A90E2', '#90C2FF'],
  font:   'Baloo 2',
  shape:  'curved',
  pageBg: 'default',
  customStickers: []
};

// ── Colour role labels ──────────────────────────────────────────
const ROLE = ['Primary', 'Secondary', 'Highlight', 'Accent 1', 'Accent 2'];

// ── Preset palettes ─────────────────────────────────────────────
const PALETTES = [
  { name: 'Hero Classic', c: ['#B71C1C', '#1A3A5C', '#2B79D8', '#4A90E2', '#FFFF00'] },
  { name: 'Ocean Tide',   c: ['#006D9C', '#1A3A4A', '#00D4AA', '#7EC8E3', '#FFB347'] },
  { name: 'Sunset Rush',  c: ['#FF6B35', '#3D2B69', '#FFD93D', '#FF9A8B', '#C77DFF'] },
  { name: 'Forest Quest', c: ['#2D6A4F', '#1B2838', '#95D5B2', '#F4A261', '#74C69D'] },
  { name: 'Galaxy',       c: ['#7B2FBE', '#0D0D2B', '#E040FB', '#00BCD4', '#FFD600'] },
];

// ── Available fonts ─────────────────────────────────────────────
const FONTS = [
  { id: 'Baloo 2',     label: 'Baloo 2',   sample: 'Adventure!' },
  { id: 'Bangers',     label: 'Bangers',   sample: 'HERO!'      },
  { id: 'Fredoka One', label: 'Fredoka',   sample: 'Wish!'      },
  { id: 'Righteous',   label: 'Righteous', sample: 'Mission!'   },
  { id: 'Nunito',      label: 'Nunito',    sample: 'Story'      },
];

// ── Sticker image files ─────────────────────────────────────────
const STICKER_FILES = [
  'star.svg',
  'lightning.svg',
  'heart.svg',
  'shield.svg',
  'crown.svg',
  'pow.svg',
  'ribbon.svg',
  'wish-tag.svg',
];
const STICKERS_PATH = 'stickers/';

// Pre-bundled data URLs — avoids file:// fetch restrictions during PDF export.
// When a sticker is placed, we use the data URL so sstore never stores file paths.
const STICKER_DATA_URLS = {
  'star.svg':      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cG9seWdvbiBwb2ludHM9IjUwLDUgNjEsMzUgOTUsMzUgNjgsNTcgNzksOTEgNTAsNzAgMjEsOTEgMzIsNTcgNSwzNSAzOSwzNSIgZmlsbD0iI0ZGRDE2NiIgc3Ryb2tlPSIjRjVBNjIzIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==',
  'lightning.svg': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cG9seWdvbiBwb2ludHM9IjYwLDUgMjUsNTUgNDgsNTUgNDAsOTUgNzUsNDUgNTIsNDUgNjAsNSIgZmlsbD0iI0Y1QTYyMyIgc3Ryb2tlPSIjQjcxQzFDIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+Cg==',
  'heart.svg':     'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cGF0aCBkPSJNNTAsODUgQzUwLDg1IDEwLDU4IDEwLDMyIEMxMCwxOCAyMCwxMCAzMiwxMCBDNDAsMTAgNDcsMTUgNTAsMjIgQzUzLDE1IDYwLDEwIDY4LDEwIEM4MCwxMCA5MCwxOCA5MCwzMiBDOTAsNTggNTAsODUgNTAsODVaIiBmaWxsPSIjQjcxQzFDIiBzdHJva2U9IiM4QjAwMDAiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPgo=',
  'shield.svg':    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cGF0aCBkPSJNNTAsOCBMODgsMjQgTDg4LDUyIEM4OCw3MiA2OCw4OCA1MCw5NSBDMzIsODggMTIsNzIgMTIsNTIgTDEyLDI0IFoiIGZpbGw9IiMyQjdFQzEiIHN0cm9rZT0iIzFBM0E1QyIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBvbHlnb24gcG9pbnRzPSI1MCwyOCA1Niw0NCA3NCw0NCA2MCw1NCA2NSw3MiA1MCw2MiAzNSw3MiA0MCw1NCAyNiw0NCA0NCw0NCIgZmlsbD0iI0ZGRDE2NiIvPgo8L3N2Zz4K',
  'crown.svg':     'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cG9seWdvbiBwb2ludHM9IjEwLDc1IDEwLDQwIDMwLDYwIDUwLDIwIDcwLDYwIDkwLDQwIDkwLDc1IiBmaWxsPSIjRkZEMTY2IiBzdHJva2U9IiNGNUE2MjMiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxyZWN0IHg9IjEwIiB5PSI3NSIgd2lkdGg9IjgwIiBoZWlnaHQ9IjE0IiByeD0iMyIgZmlsbD0iI0Y1QTYyMyIvPgogIDxjaXJjbGUgY3g9IjUwIiBjeT0iMjAiIHI9IjYiIGZpbGw9IiNCNzFDMUMiLz4KICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjQwIiByPSI1IiBmaWxsPSIjQjcxQzFDIi8+CiAgPGNpcmNsZSBjeD0iOTAiIGN5PSI0MCIgcj0iNSIgZmlsbD0iI0I3MUMxQyIvPgo8L3N2Zz4K',
  'pow.svg':       'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cG9seWdvbiBwb2ludHM9IjUwLDIgNTgsMzAgODQsMTggNzIsNDQgOTgsNTAgNzIsNTYgODQsODIgNTgsNzAgNTAsOTggNDIsNzAgMTYsODIgMjgsNTYgMiw1MCAyOCw0NCAxNiwxOCA0MiwzMCIgZmlsbD0iIzMyQTkyQSIgc3Ryb2tlPSIjMUE1QzFBIiBzdHJva2Utd2lkdGg9IjEuNSIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IidCYWxvbyAyJyxjdXJzaXZlIiBmb250LXNpemU9IjIyIiBmb250LXdlaWdodD0iODAwIiBmaWxsPSIjZmZmIj5QT1chPC90ZXh0Pgo8L3N2Zz4K',
  'ribbon.svg':    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjQyIiByPSIzMiIgZmlsbD0iIzJCN0VDMSIgc3Ryb2tlPSIjMUEzQTVDIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cG9seWdvbiBwb2ludHM9IjUwLDE0IDU2LDMwIDc0LDMwIDYwLDQwIDY1LDU4IDUwLDQ3IDM1LDU4IDQwLDQwIDI2LDMwIDQ0LDMwIiBmaWxsPSIjRkZEMTY2Ii8+CiAgPHBvbHlnb24gcG9pbnRzPSIzMiw3MCAyMCw5NSAzOCw4NSA1MCw5NSA2Miw4NSA4MCw5NSA2OCw3MCIgZmlsbD0iI0I3MUMxQyIvPgo8L3N2Zz4K',
  'wish-tag.svg':  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgNTAiPgogIDxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIxMTYiIGhlaWdodD0iNDYiIHJ4PSIyMyIgZmlsbD0iI0I3MUMxQyIvPgogIDx0ZXh0IHg9IjYwIiB5PSIzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IidCYWxvbyAyJyxjdXJzaXZlIiBmb250LXNpemU9IjIyIiBmb250LXdlaWdodD0iODAwIiBmaWxsPSIjRkZEMTY2Ij7inKYgV0lTSCDinKY8L3RleHQ+Cjwvc3ZnPgo=',
};

// ── Angular shape clip-paths ────────────────────────────────────
const ANGULAR_BLOBS = [
  'polygon(50% 0%,58.3% 19.1%,75% 6.7%,72.6% 27.4%,93.3% 25%,80.9% 41.7%,100% 50%,80.9% 58.3%,93.3% 75%,72.6% 72.6%,75% 93.3%,58.3% 80.9%,50% 100%,41.7% 80.9%,25% 93.3%,27.4% 72.6%,6.7% 75%,19.1% 58.3%,0% 50%,19.1% 41.7%,6.7% 25%,27.4% 27.4%,25% 6.7%,41.7% 19.1%)',
  'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)',
  'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
  'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
  'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
];

const STAR_CLIP = ANGULAR_BLOBS[0];
const OCT_CLIP  = 'polygon(8% 0%,92% 0%,100% 8%,100% 92%,92% 100%,8% 100%,0% 92%,0% 8%)';

// ── Page manifest (32 physical pages) ──────────────────────────
// Front Cover        = 1 page  (the cover)
// Info spread        = 2 pages (Page 1: description  |  Page 2: photo)
// 14 regular spreads = 28 pages (Pages 3–30)
// Back Cover         = 1 page
// Total: 32 pages across 17 views
const PAGES = [
  { id: 'front',  label: 'Front Cover',  type: 'cover'       },
  { id: 'isp',    label: 'Pages 1–2',    type: 'info-spread' },
  { id: 'sp1',    label: 'Pages 3–4',    type: 'sa'          },
  { id: 'sp2',    label: 'Pages 5–6',    type: 'sb'          },
  { id: 'sp3',    label: 'Pages 7–8',    type: 'sc'          },
  { id: 'sp4',    label: 'Pages 9–10',   type: 'sd'          },
  { id: 'sp5',    label: 'Pages 11–12',  type: 'sa'          },
  { id: 'sp6',    label: 'Pages 13–14',  type: 'sb'          },
  { id: 'sp7',    label: 'Pages 15–16',  type: 'sc'          },
  { id: 'sp8',    label: 'Pages 17–18',  type: 'sd'          },
  { id: 'sp9',    label: 'Pages 19–20',  type: 'sa'          },
  { id: 'sp10',   label: 'Pages 21–22',  type: 'sb'          },
  { id: 'sp11',   label: 'Pages 23–24',  type: 'sc'          },
  { id: 'sp12',   label: 'Pages 25–26',  type: 'sd'          },
  { id: 'sp13',   label: 'Pages 27–28',  type: 'sa'          },
  { id: 'sp14',   label: 'Pages 29–30',  type: 'sb'          },
  { id: 'back',   label: 'Back Cover',   type: 'back'        },
];

// ── Spread layout blob-colour configs ───────────────────────────
const LC = [
  { b1: () => CFG.colors[3], b2: () => CFG.colors[4] },
  { b1: () => CFG.colors[4], b2: () => CFG.colors[2] },
  { b1: () => CFG.colors[2], b2: () => CFG.colors[3] },
  { b1: () => CFG.colors[3], b2: () => CFG.colors[0] },
];

// ── Mutable editor state ────────────────────────────────────────
let imgs        = {};
let pageFrames  = {};   // array of {x,y,w,h} per spread side key
let sstore      = {};
let curPage     = 0;
let blobIdx     = 0;
