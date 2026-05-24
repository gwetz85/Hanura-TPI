import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, '..', 'public', 'logo-original.png');
const outputPath = path.join(__dirname, '..', 'public', 'logo.png');

async function removeWhiteBackground() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  
  if (!width || !height) {
    throw new Error('Could not get image dimensions');
  }

  // Get raw pixel data (RGBA)
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const visited = new Uint8Array(width * height);
  const queue = [];
  
  // Threshold: if a pixel is close to white/light gray, make it transparent
  const threshold = 240; // pixels with R, G, B all above this are considered "background"
  
  function enqueue(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    queue.push([x, y]);
  }

  // Enqueue outer border pixels to ensure we catch any background borders
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const idx = (cy * width + cx) * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    
    // If pixel is very close to white (the background color)
    if (r >= threshold && g >= threshold && b >= threshold) {
      pixels[idx + 3] = 0; // Set alpha to 0 (transparent)
      
      // Enqueue 4-way neighbors
      enqueue(cx + 1, cy);
      enqueue(cx - 1, cy);
      enqueue(cx, cy + 1);
      enqueue(cx, cy - 1);
    }
  }
  
  await sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Background removed. Output saved to: ${outputPath}`);
  console.log(`   Dimensions: ${info.width}x${info.height}`);
}

removeWhiteBackground().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
