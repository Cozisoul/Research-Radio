const density = 'Ñ@#W$9876543210?!abc;:+=-,._ ';

export function draw(p, pg) {
  p.background(0, 0);
  const step = 8;
  pg.loadPixels();
  for (let y = 0; y < pg.height; y += step) {
    for (let x = 0; x < pg.width; x += step) {
      const idx = (y * pg.width + x) * 4;
      const r = pg.pixels[idx];
      const g = pg.pixels[idx + 1];
      const b = pg.pixels[idx + 2];
      const brightness = (r + g + b) / 3;
      const char = density.charAt(Math.floor(p.map(brightness, 0, 255, density.length - 1, 0)));
      p.fill(255);
      p.textSize(8);
      p.text(char, x, y + step);
    }
  }
}
