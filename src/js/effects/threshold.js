// EFFECT MODULE: Threshold
export function draw(p, video) {
  p.image(video, 0, 0);
  p.filter(p.THRESHOLD);
}