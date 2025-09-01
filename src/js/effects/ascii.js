const density = 'Ñ@#W$9876543210?!abc;:+=-,._ ';

export function draw(p, pg) {
  p.background(0);
  p.fill(255);
  p.textFont('monospace');
  p.textSize(8);

  pg.loadPixels();
  if (pg.pixels.length === 0) return;

  for (let y = 0; y < pg.height; y += 8) {
    for (let x = 0; x < pg.width; x += 4) {
      const index = (y * pg.width + x) * 4;
      const r = pg.pixels[index];
      const g = pg.pixels[index + 1];
      const b = pg.pixels[index + 2];
      const brightness = (r + g + b) / 3;
      
      const charIndex = p.floor(p.map(brightness, 0, 255, density.length - 1, 0));
      p.text(density.charAt(charIndex), x, y);
    }
  }
}