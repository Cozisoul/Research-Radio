// TMM-OS: SENSOR-FX (DEFINITIVE V4.2 – MOBILE & MEMORY-SAFE)
import { draw as threshold } from '../effects/threshold.js';
import { draw as pixelGrid } from '../effects/pixelGrid.js';
import { draw as ascii } from '../effects/ascii.js';
import { draw as bitmap } from '../effects/bitmap.js';

const effects = [
  { name: 'Threshold', sketch: threshold },
  { name: 'Pixel Grid', sketch: pixelGrid },
  { name: 'ASCII', sketch: ascii },
  { name: 'Bitmap', sketch: bitmap },
];

export function SensorFX({ tileId, canvasContainerId }) {
  const tileEl = document.getElementById(tileId);
  const container = document.getElementById(canvasContainerId);
  const statusEl = tileEl?.querySelector('.meta');
  const activateBtn = tileEl?.querySelector('button');
  if (!container) return;

  let sketchInstance = null;
  let isActive = false;
  let currentEffectIndex = 0;

  function p5_sketch(p) {
    let video, pg;          // << single cached graphics
    p.setup = () => {
      p.createCanvas(10, 10);
      p.windowResized();
      video = p.createCapture({ video: { width: p.width, height: p.height } });
      video.hide();
      if (statusEl) statusEl.textContent = `* STATUS: LIVE (${effects[0].name})`;
      if (activateBtn) activateBtn.textContent = 'Deactivate';

      const controls = document.createElement('div');
      controls.className = 'sensor-modal-controls';
      const cycle = document.createElement('button');
      cycle.textContent = 'Cycle Effect';
      cycle.addEventListener('click', () => {
        currentEffectIndex = (currentEffectIndex + 1) % effects.length;
        if (statusEl) statusEl.textContent = `* STATUS: LIVE (${effects[currentEffectIndex].name})`;
      });
      controls.appendChild(cycle);
      container.insertAdjacentElement('afterend', controls);
    };

    p.draw = () => {
      if (video?.elt?.readyState >= 2) {
        if (!pg || pg.width !== video.width || pg.height !== video.height) {
          if (pg) pg.remove();
          pg = p.createGraphics(video.width, video.height);
        }
        pg.image(video, 0, 0, pg.width, pg.height);
        p.push();
        p.translate(p.width, 0);
        p.scale(-1, 1);
        effects[currentEffectIndex].sketch(p, pg);
        p.pop();
      }
    };

    p.windowResized = () => {
      const w = container.clientWidth;
      const h = Math.round(w * 3 / 4);
      p.resizeCanvas(w, h);
    };
  }

  function activate() {
    if (isActive) return;
    isActive = true;
    sketchInstance = new p5(p5_sketch, container);
  }
  function deactivate() {
    if (!isActive) return;
    isActive = false;
    sketchInstance?.remove();
    sketchInstance = null;
    if (statusEl) statusEl.textContent = '* STATUS: OFFLINE';
    if (activateBtn) activateBtn.textContent = 'Activate';
    document.querySelector('.sensor-modal-controls')?.remove();
  }
  activateBtn?.addEventListener('click', () => (isActive ? deactivate() : activate()));
  return { activate, deactivate };
}