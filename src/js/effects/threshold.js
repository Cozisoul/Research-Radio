export function draw(p, pg) {
  pg.loadPixels();
  if (pg.pixels.length === 0) return;

  p.loadPixels();
  for (let i = 0; i < pg.pixels.length; i += 4) {
    const r = pg.pixels[i];
    const g = pg.pixels[i + 1];
    const b = pg.pixels[i + 2];
    const brightness = (r + g + b) / 3;
    const val = brightness > 100 ? 255 : 0;
    p.pixels[i] = val;
    p.pixels[i+1] = val;
    p.pixels[i+2] = val;
    p.pixels[i+3] = 255;
  }
  p.updatePixels();
}