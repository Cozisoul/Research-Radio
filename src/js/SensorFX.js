// TMM-OS: PERIPHERAL MODULE (DEFINITIVE V1.7 - FINAL)
// FILE: /src/js/SensorFX.js
// DESC: A robust, self-rendering, and correctly toggling p5.js host.

import { draw as pixelGrid } from './effects/pixelGrid.js';
import { draw as threshold } from './effects/threshold.js';
// Import any other effects you create here

const effects = [
  { name: 'Pixel Grid', sketch: pixelGrid },
  { name: 'Threshold', sketch: threshold },
];

export function SensorFX(config) {
  const tile = document.getElementById(config.tileId);
  if (!tile) {
    console.warn("SensorFX tile not found. Module will not initialize.");
    return;
  }

  // --- 1. Build UI Elements Programmatically ---
  tile.innerHTML = ''; // Clear any previous content
  const header = document.createElement('h3');
  header.textContent = 'Sensor/FX Module';

  const statusEl = document.createElement('p');
  statusEl.className = 'meta';
  statusEl.textContent = '* STATUS: OFFLINE';

  const controls = document.createElement('div');
  controls.className = 'sensor-controls';

  const activateBtn = document.createElement('button');
  activateBtn.id = 'activateSensor';
  activateBtn.textContent = 'Activate';

  const cycleBtn = document.createElement('button');
  cycleBtn.id = 'cycleEffect';
  cycleBtn.textContent = 'Cycle Effect';
  cycleBtn.hidden = true;

  const container = document.createElement('div');
  container.id = 'sensor-canvas-container';
  
  controls.appendChild(activateBtn);
  controls.appendChild(cycleBtn);

  tile.appendChild(header);
  tile.appendChild(statusEl);
  tile.appendChild(controls);
  tile.appendChild(container);

  // --- 2. State & Logic ---
  let sketchInstance = null;
  let video;
  let currentEffectIndex = 0;

  function p5_sketch(p) {
    p.setup = () => {
      const canvas = p.createCanvas(container.offsetWidth, (container.offsetWidth * 3) / 4);
      canvas.parent(container);
      video = p.createCapture(p.VIDEO);
      video.size(p.width, p.height);
      video.hide();
    };
    p.draw = () => {
      effects[currentEffectIndex].sketch(p, video);
    };
    p.windowResized = () => {
      // Make it responsive
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
  }

  // ============================================================
  // THIS IS THE DEFINITIVE FIX FOR THE TOGGLE LOGIC
  // ============================================================
  function activate() {
    tile.classList.add('sensor-live');
    statusEl.textContent = `* STATUS: LIVE (${effects[currentEffectIndex].name})`;
    // CORRECT: The button's text now correctly changes to "Deactivate"
    activateBtn.textContent = 'Deactivate'; 
    cycleBtn.removeAttribute('hidden');
    sketchInstance = new p5(p5_sketch);
  }

  function deactivate() {
    tile.classList.remove('sensor-live');
    if (sketchInstance) sketchInstance.remove();
    if (video) video.stop();
    sketchInstance = null;
    video = null;
    statusEl.textContent = '* STATUS: OFFLLINE';
    // CORRECT: The button's text correctly reverts to "Activate"
    activateBtn.textContent = 'Activate';
    cycleBtn.setAttribute('hidden', '');
  }
  // ============================================================

  function cycleEffect() {
    if (!sketchInstance) return;
    currentEffectIndex = (currentEffectIndex + 1) % effects.length;
    statusEl.textContent = `* STATUS: LIVE (${effects[currentEffectIndex].name})`;
  }

  // --- 3. Attach Event Listeners Directly ---
  // This toggle now correctly calls the fixed activate/deactivate functions.
  activateBtn.addEventListener('click', () => {
    sketchInstance ? deactivate() : activate();
  });
  
  cycleBtn.addEventListener('click', cycleEffect);
}