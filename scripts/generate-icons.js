// One-off/regenerable tool: renders the app's PWA icons from a single inline
// SVG source (the "approval stamp" motif, echoing the .stamp element in
// public/css/style.css) to every PNG size the manifest/meta tags need.
// Not a runtime dependency -- run `npm install --save-dev sharp` first, then
// `node scripts/generate-icons.js` after editing the SVG below, then
// `npm uninstall sharp` again so it doesn't ship with the app.
const path = require('path');
const sharp = require('sharp');

// Full-bleed square, no self-rounding -- each OS applies its own mask
// (circle/squircle/rounded-square), so this single source serves "any" and
// "maskable" manifest entries alike. The stamp shape stays within the
// maskable safe zone (inner ~80% circle, radius ~205 of a 512 canvas).
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1f7a5c"/>
  <g transform="translate(256,256) rotate(-8)">
    <rect x="-140" y="-95" width="280" height="190" rx="26" fill="#ffffff"/>
    <path d="M -63 4 L -18 50 L 72 -50" fill="none" stroke="#1f7a5c"
          stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

const outDir = path.join(__dirname, '..', 'public', 'icons');

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-192.png', size: 192 },
  { file: 'icon-maskable-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32.png', size: 32 },
];

(async () => {
  const svgBuffer = Buffer.from(svg);
  for (const { file, size } of targets) {
    await sharp(svgBuffer, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, file));
    console.log(`wrote ${file} (${size}x${size})`);
  }
})();
