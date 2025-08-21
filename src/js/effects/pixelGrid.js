// EFFECT MODULE: Pixel Grid
export function draw(p, video) {
  p.background(0, 15); // Slower fade for effect
  video.loadPixels();
  const stepSize = 12;
  for (let y = 0; y < p.height; y += stepSize) {
    for (let x = 0; x < p.width; x += stepSize) {
      const i = (y * p.width + x) * 4;
      const r = video.pixels[i];
      const g = video.pixels[i + 1];
      const b = video.pixels[i + 2];
      const brightness = (r + g + b) / 3;
      const radius = p.map(brightness, 0, 255, 0, stepSize * 1.5);
      p.fill(r, g, b);
      p.ellipse(x, y, radius, radius);
    }
  }
}