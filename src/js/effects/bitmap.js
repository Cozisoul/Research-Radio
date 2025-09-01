export function draw(p, pg) {
  p.background(0);
  pg.loadPixels();
  if (pg.pixels.length === 0) return;

  const stepSize = 8;
  for (let y = 0; y < pg.height; y += stepSize) {
    for (let x = 0; x < pg.width; x += stepSize) {
      const index = (y * pg.width + x) * 4;
      const r = pg.pixels[index];
      const g = pg.pixels[index+1];
      const b = pg.pixels[index+2];
      const brightness = (r + g + b) / 3;
      const diameter = p.map(brightness, 0, 255, 0, stepSize * 1.5);
      p.fill(255);
      p.noStroke();
      p.circle(x + stepSize / 2, y + stepSize / 2, diameter);
    }
  }
}