import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, '..', 'public', 'logo-original.png');
const outputPath = path.join(__dirname, '..', 'public', 'logo.png');

async function removeWhiteBackground() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  
  // Get raw pixel data (RGBA)
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  
  // Threshold: if a pixel is close to white/light gray, make it transparent
  const threshold = 230; // pixels with R, G, B all above this are considered "background"
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // If pixel is very close to white (the background color)
    if (r >= threshold && g >= threshold && b >= threshold) {
      pixels[i + 3] = 0; // Set alpha to 0 (transparent)
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
