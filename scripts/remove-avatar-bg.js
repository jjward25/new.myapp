// scripts/remove-avatar-bg.js
// Removes the plain white/off-white BACKGROUND from portrait/figure PNGs in
// public/avatars/ — flood-filled from the image border, not a global color
// threshold, so isolated near-white regions inside the subject (white
// sneakers, paper, shirt highlights) are left alone instead of also being
// erased.
// Run: node scripts/remove-avatar-bg.js [name ...]  (defaults to the 5 originals)
// Names are file basenames without ".png", e.g. `node scripts/remove-avatar-bg.js skinny-hobo`

const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '../public/avatars');
const NAMES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['mozart', 'tesla', 'franklin', 'edison', 'davinci'];

const BRIGHTNESS_MIN = 205;
const SATURATION_MAX = 25;
const FADE_START = 210; // below this, fully opaque
const FADE_END = 245; // at/above this, fully transparent

// Enclosed near-white pockets not touching the border (e.g. the gap between
// a dangling arm and the torso) ARE real background, but a generic size
// cutoff can't tell one apart from a legitimate interior detail of similar
// size (a clipboard's paper, a large sneaker highlight) — a real case
// (skinny-checklist's paper) got wrongly erased when tried. So this is
// opt-in per file: one interior [x, y] seed pixel known to sit inside an
// actual background pocket. Add an entry only when you've visually confirmed
// a gap that needs it.
const INTERIOR_HOLE_SEEDS = {
  'buff-curls': [[316, 651]], // gap between the dangling arm and torso
};

async function removeWhiteBg(name) {
  const src = path.join(DIR, `${name}.png`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const n = width * height;

  const isBgColor = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = Math.max(r, g, b);
    const saturation = brightness - Math.min(r, g, b);
    return brightness > BRIGHTNESS_MIN && saturation < SATURATION_MAX;
  };

  // Flood fill from every border pixel through background-colored pixels
  // only. This naturally stops at the subject's black outline (which is
  // dark, so isBgColor is false there) and never reaches interior white
  // regions unless they're actually connected to the border.
  const bg = new Uint8Array(n); // 1 = part of the connected background
  const visited = new Uint8Array(n);
  const queue = new Int32Array(n);
  let qHead = 0, qTail = 0;

  const tryEnqueue = (p) => {
    if (visited[p]) return;
    visited[p] = 1;
    if (isBgColor(p * 4)) {
      bg[p] = 1;
      queue[qTail++] = p;
    }
  };

  for (let x = 0; x < width; x++) {
    tryEnqueue(x);
    tryEnqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(y * width);
    tryEnqueue(y * width + width - 1);
  }

  while (qHead < qTail) {
    const p = queue[qHead++];
    const x = p % width, y = (p / width) | 0;
    if (x > 0) tryEnqueue(p - 1);
    if (x < width - 1) tryEnqueue(p + 1);
    if (y > 0) tryEnqueue(p - width);
    if (y < height - 1) tryEnqueue(p + width);
  }

  // Second pass: flood-fill from any explicit interior seed points for this
  // file, through background-colored pixels only — fills just that specific
  // known pocket, leaving every other interior near-white region (clothing,
  // paper, highlights) untouched.
  for (const [sx, sy] of INTERIOR_HOLE_SEEDS[name] || []) {
    const start = sy * width + sx;
    if (bg[start] || !isBgColor(start * 4)) continue;
    const stack = [start];
    bg[start] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % width, y = (p / width) | 0;
      const nbrs = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1];
      for (const nb of nbrs) {
        if (nb < 0 || bg[nb] || !isBgColor(nb * 4)) continue;
        bg[nb] = 1;
        stack.push(nb);
      }
    }
  }

  for (let p = 0; p < n; p++) {
    if (!bg[p]) continue;
    const i = p * 4;
    const brightness = Math.max(data[i], data[i + 1], data[i + 2]);
    // Soft fade near the subject's edge; hard cut for the flat interior of
    // the background so lossy JPG noise (background landing at ~245-250
    // instead of 255) doesn't leave residual opacity.
    if (brightness >= FADE_END) {
      data[i + 3] = 0;
    } else {
      const fade = Math.max(0, (brightness - FADE_START) / (FADE_END - FADE_START));
      data[i + 3] = Math.round(data[i + 3] * (1 - fade));
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(src);
  console.log(`✓ ${name}.png — background flood-removed`);
}

(async () => {
  for (const name of NAMES) {
    await removeWhiteBg(name);
  }
  console.log('\nDone.');
})();
