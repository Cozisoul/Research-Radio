export function draw(p, pg) {
  pg.loadPixels();
  if (pg.pixels.length === 0) return;

  p.background(0);
  const stepSize = p.map(p.mouseX, 0, p.width, 5, 20); // Interactive step size

  for (let y = 0; y < pg.height; y += stepSize) {
    for (let x = 0; x < pg.width; x += stepSize) {
      const index = (y * pg.width + x) * 4;
      const r = pg.pixels[index];
      const g = pg.pixels[index + 1];
      const b = pg.pixels[index + 2];
      p.fill(r, g, b);
      p.noStroke();
      p.rect(x, y, stepSize, stepSize);
    }
  }
}