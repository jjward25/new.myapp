// scripts/remove-avatar-bg.js
// Removes white backgrounds from cropped portrait PNGs in public/avatars/.
// Run: node scripts/remove-avatar-bg.js

const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '../public/avatars');
const NAMES = ['mozart', 'tesla', 'franklin', 'edison', 'davinci'];

async function removeWhiteBg(name) {
  const src = path.join(DIR, `${name}.png`);
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info; // channels = 4 (RGBA)
  const px = new Uint8Array(data.buffer);

  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const r = px[o], g = px[o + 1], b = px[o + 2];
    const brightness = Math.max(r, g, b);
    const saturation = brightness - Math.min(r, g, b);
    // White or near-white (high brightness, low saturation) → transparent.
    // Soft edge: pixels in the 210-255 brightness range fade out rather than
    // hard-cutting, which preserves cartoon anti-aliased outlines.
    if (brightness > 210 && saturation < 25) {
      const fade = Math.max(0, (brightness - 210) / 45); // 0→1 as brightness 210→255
      px[o + 3] = Math.round(px[o + 3] * (1 - fade));
    }
  }

  await sharp(px, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(src);

  console.log(`✓ ${name}.png — white bg removed`);
}

(async () => {
  for (const name of NAMES) {
    await removeWhiteBg(name);
  }
  console.log('\nDone.');
})();
