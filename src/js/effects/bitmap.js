export function draw(p, pg) {
  // A classic 1‑bit bitmap – threshold at 128
  p.loadPixels();
  pg.loadPixels();
  for (let i = 0; i < pg.pixels.length; i += 4) {
    const r = pg.pixels[i];
    const g = pg.pixels[i + 1];
    const b = pg.pixels[i + 2];
    const brightness = (r + g + b) / 3;
    const val = brightness > 128 ? 255 : 0;
    p.pixels[i] = val;
    p.pixels[i + 1] = val;
    p.pixels[i + 2] = val;
    p.pixels[i + 3] = 255;
  }
  p.updatePixels();
}
