export function draw(p, pg) {
  p.background(0, 0);
  const step = 10;
  for (let y = 0; y < pg.height; y += step) {
    for (let x = 0; x < pg.width; x += step) {
      const idx = (y * pg.width + x) * 4;
      const r = pg.pixels[idx];
      const g = pg.pixels[idx + 1];
      const b = pg.pixels[idx + 2];
      const brightness = (r + g + b) / 3;
      const c = p.map(brightness, 0, 255, 0, 255);
      p.fill(c);
      p.noStroke();
      p.rect(x, y, step, step);
    }
  }
}
