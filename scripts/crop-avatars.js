// scripts/crop-avatars.js
// Crops the 5 portrait heads from public/avatars/source.png
// Run: node scripts/crop-avatars.js

const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '../public/avatars/source.png');
const OUT = path.join(__dirname, '../public/avatars');

// Source image is 2048x768.
// Each portrait occupies roughly 1/5 of the width.
// Top text labels end ~y=110; bottom text labels start ~y=660.
const portraits = [
  { name: 'mozart',   left:  10, top: 185, width: 395, height: 450 },
  { name: 'tesla',    left: 415, top: 148, width: 395, height: 490 },
  { name: 'franklin', left: 820, top: 143, width: 410, height: 500 },
  { name: 'edison',   left: 1240, top: 148, width: 395, height: 490 },
  { name: 'davinci',  left: 1648, top: 143, width: 395, height: 495 },
];

(async () => {
  for (const p of portraits) {
    const dest = path.join(OUT, `${p.name}.png`);
    await sharp(SRC)
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .png()
      .toFile(dest);
    console.log(`✓ ${p.name}.png`);
  }
  console.log('\nDone. Next: run Depth Anything in ComfyUI on each file,');
  console.log('save grayscale depth maps as {name}-depth.png in the same folder.');
})();
