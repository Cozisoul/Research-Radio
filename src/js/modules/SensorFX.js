// TMM-OS: PERIPHERAL MODULE (DEFINITIVE V4.1 - STABLE & RESPONSIVE)
// FILE: /src/js/modules/SensorFX.js

// Import your effects here. Ensure these files exist.
import { draw as threshold } from '../effects/threshold.js';
import { draw as pixelGrid } from '../effects/pixelGrid.js';
import { draw as ascii } from '../effects/ascii.js';
import { draw as bitmap } from '../effects/bitmap.js';

// The full effects router
const effects = [
  { name: 'Threshold', sketch: threshold },
  { name: 'Pixel Grid', sketch: pixelGrid },
  { name: 'ASCII', sketch: ascii },
  { name: 'Bitmap', sketch: bitmap },
];

export function SensorFX(config) {
  const tileElement = document.getElementById(config.tileId);
  const canvasContainer = document.getElementById(config.canvasContainerId);
  const statusEl = tileElement?.querySelector('.meta');
  const activateBtn = tileElement?.querySelector('button');

  if (!canvasContainer) { return; }

  let sketchInstance = null;
  let isActive = false;

  function p5_sketch(p) {
    let video;
    let currentEffectIndex = 0;

    p.setup = () => {
      // Create a tiny placeholder canvas first.
      p.createCanvas(10, 10);
      
      // Call our resize function ONCE at the start to get the correct size.
      p.windowResized();

      const captureConstraints = { video: { width: p.width, height: p.height } };
      video = p.createCapture(captureConstraints);
      video.hide();

      // Create and append the controls programmatically
      const controlsContainer = document.createElement('div');
      controlsContainer.className = 'sensor-modal-controls';
      const cycleBtn = document.createElement('button');
      cycleBtn.textContent = 'Cycle Effect';
      cycleBtn.addEventListener('click', () => {
        currentEffectIndex = (currentEffectIndex + 1) % effects.length;
        if (statusEl) statusEl.textContent = `* STATUS: LIVE (${effects[currentEffectIndex].name})`;
      });
      controlsContainer.appendChild(cycleBtn);
      canvasContainer.insertAdjacentElement('afterend', controlsContainer);
    };

    p.draw = () => {
      // Use the most reliable check to see if the video is ready.
      if (video.loadedmetadata) {
        const pg = p.createGraphics(video.width, video.height);
        pg.image(video, 0, 0, pg.width, pg.height);
        
        p.push();
        p.translate(p.width, 0);
        p.scale(-1, 1);
        effects[currentEffectIndex].sketch(p, pg);
        p.pop();
        pg.remove();
      }
    };

    // THE DEFINITIVE FIX: This function is called by p5.js automatically on resize,
    // and we also call it ourselves in setup() to set the correct initial size.
    p.windowResized = () => {
        const containerWidth = canvasContainer.clientWidth;
        const targetHeight = (containerWidth * 3) / 4; // Enforce 4:3 aspect ratio
        p.resizeCanvas(containerWidth, targetHeight);
    }
  }

  function activate() {
    if (isActive) return;
    isActive = true;
    if (statusEl) statusEl.textContent = `* STATUS: LIVE (${effects[0].name})`;
    if (activateBtn) activateBtn.textContent = 'Deactivate';

    // Delay instantiation slightly to guarantee the modal's CSS animation is finished.
    setTimeout(() => {
        if (!isActive) return; // Check if it was deactivated before timeout finished
        sketchInstance = new p5(p5_sketch, canvasContainer);
    }, 350); // A time slightly longer than the CSS transition
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    if (sketchInstance) {
      sketchInstance.remove();
      sketchInstance = null;
    }
    if (statusEl) statusEl.textContent = '* STATUS: OFFLINE';
    if (activateBtn) activateBtn.textContent = 'Activate';
    const controls = document.querySelector('.sensor-modal-controls');
    if (controls) controls.remove();
  }

  activate();
  return { deactivate };
}