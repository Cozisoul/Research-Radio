export function draw(p, pg) {
  // Dummy – just show black text on transparent canvas
  p.background(0, 0);
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('Threshold', pg.width / 2, pg.height / 2);
}
