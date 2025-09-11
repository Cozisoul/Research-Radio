/* -------------------------------------------------------------------
 *  Research Radio – app.js
 *  -------------------------------------------------------------------
 *
 *  The modal is intentionally opened by adding the `is-open` class
 *  to the `<div id="unifiedModal">`.  The close button lives *inside*
 *  the modal-content block so that it always stays anchored to the
 *  dialog and cannot be lost in the page flow.
 * ------------------------------------------------------------------- */

import { db } from '../content/database.js';
import { SignalPlayer } from './modules/SignalPlayer.js';
import { SensorFX } from './modules/SensorFX.js';

/* ================================================================
 *  1️⃣  DOM CACHE
 * ================================================================ */
const dom = {
  body: document.body,
  modal: document.getElementById('unifiedModal'),
  modalBody: document.querySelector('.modal-body'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  journalList: document.getElementById('journalList'),
  projectList: document.getElementById('projectList'),
  currentList: document.getElementById('currentList'),
  liveDataComponent: document.getElementById('live-data-component'),
  sensorControl: document.getElementById('sensor-control'),
};

/* ================================================================
 *  2️⃣  STATE
 * ================================================================ */
let contentData = {};
let activeSensor = null;

/* ================================================================
 *  NEW -> 2.1  GENERATIVE SIGNAL MODULE
 * ================================================================ */
const GenerativeSignal = (function() {
  let animationId;
  const signal_patterns = [
    (time) => `M0,25 ${Array.from({length: 100}, (_, x) => `L${x+1},${25 + Math.sin((x+1) * 0.1 + time) * 15}`).join(' ')}`,
    (time) => `M0,25 ${Array.from({length: 100}, (_, x) => `L${x+1},${25 + (Math.sin((x+1) * 0.1 + time) * 10) + (Math.sin((x+1) * 0.2 + time * 2) * 5)}`).join(' ')}`,
    (time) => `M0,25 ${Array.from({length: 100}, (_, x) => `L${x+1},${25 + (Math.sin((x+1) * 0.3 + time) * 12) + (Math.random() - 0.5) * 5}`).join(' ')}`,
  ];

  function start(container) {
    if (!container) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('viewBox', '0 0 100 50');
    const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--accent)');
    path.setAttribute('stroke-width', '0.5');
    svg.appendChild(path);
    container.innerHTML = '';
    container.appendChild(svg);
    const randomPattern = signal_patterns[Math.floor(Math.random() * signal_patterns.length)];
    let time = 0;
    function animate() {
      time += 0.03;
      path.setAttribute('d', randomPattern(time));
      animationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stop() {
    cancelAnimationFrame(animationId);
  }
  return { start, stop };
})();

/* ================================================================
 *  3️⃣  VIEW HANDLING
 * ================================================================ */
function setView(view) {
  dom.body.dataset.view = view;
}

/* ================================================================
 *  4️⃣  MODAL MANAGEMENT (UPGRADED)
 * ================================================================ */
function openModal(content, layoutClass = '') {
  dom.modalBody.innerHTML = content;
  dom.modalBody.className = `modal-body ${layoutClass}`;
  dom.modal.classList.add('is-open');
  setView('modal');
  const signalContainer = dom.modalBody.querySelector('#signal-container');
  if (signalContainer) {
    GenerativeSignal.start(signalContainer);
  }
}

function closeModal() {
  if (activeSensor) {
    activeSensor.deactivate();
    activeSensor = null;
  }
  GenerativeSignal.stop(); // Stop the signal on ANY modal close
  dom.modal.classList.remove('is-open');
  setView('hub');
}

/* ================================================================
 *  5️⃣  RENDER FUNCTIONS
 * ================================================================ */
function renderHubContent() {
  dom.journalList.innerHTML = contentData.journalEntries.map(item => `<li><a href="#" data-trigger="journal" data-id="${item.id}">${item.title}</a><p class="meta">${item.summary}</p></li>`).join('');
  dom.projectList.innerHTML = contentData.projects.map(proj => `<li><a href="${proj.href}" target="_blank" rel="noopener">${proj.title}</a><p class="meta">${proj.note}</p></li>`).join('');
  dom.currentList.innerHTML = contentData.currentInput.map(item => `<li><p class="current-input-category">${item.category}</p><p>${item.title} <em class="meta">(${item.note})</em></p></li>`).join('');
}

/* ================================================================
 *  6️⃣  LIVE‑DATA COMPONENT
 * ================================================================ */
function updateLiveData() {
  if (!dom.liveDataComponent) return;
  const now = new Date();
  const timeUTC = now.toLocaleTimeString('en-GB', { timeZone: 'UTC' });
  const date = now.toLocaleDateString('en-CA');
  dom.liveDataComponent.textContent = `JOHANNESBURG — ${date} — ${timeUTC} UTC`;
}

// In Research-Radio/src/js/app.js
function renderProjects() {
    projectList.innerHTML = db.projects.map(proj => `
        <li>
            <a href="${proj.href}" target="_blank" rel="noopener">${proj.title}</a>
            <p class="meta">${proj.note}</p>
        </li>
    `).join('');
}

/* ================================================================
 *  7️⃣  GLOBAL EVENT HANDLER (DEFINITIVE FIX)
 * ================================================================ */
function handleGlobalClick(event) {
  const trigger = event.target.closest('[data-trigger]');
  if (!trigger) return;

  const triggerType = trigger.dataset.trigger;

  if (triggerType === 'journal') {
    const entry = contentData.journalEntries.find(j => j.id == trigger.dataset.id);
    if (entry) {
      // CRITICAL FIX: The journal entry content is now wrapped in the full
      // two-column layout, including a new signal container.
      const content = `
        <div class="layout-essay">
          <div class="essay-content">
            <h2>${entry.title}</h2>
            <p class="meta">${entry.date}</p>
            <div>${window.marked.parse(entry.summary)}</div>
          </div>
          <aside class="marginalia">
            <figure id="signal-container"></figure>
            <figcaption class="meta">FIG. ${String(entry.id).padStart(3, '0')} – LIVE SIGNAL</figcaption>
          </aside>
        </div>`;
      
      // CRITICAL FIX: We must pass 'layout-essay' to the openModal function.
      openModal(content, 'layout-essay');
    }
  }


  if (triggerType === 'sensorfx') {
    const content = `<div id="sensor-canvas-container"></div>`;
    openModal(content, 'layout-sensor');
    activeSensor = SensorFX({
      tileId: 'sensor-control',
      canvasContainerId: 'sensor-canvas-container',
    });
  }
}

/* ================================================================
 *  8️⃣  INITIALIZATION (BOOT SEQUENCE - DEFINITIVE FIX)
 * ================================================================ */
function initialize() {
  contentData = db;
  renderHubContent();

  const issueZeroHtml = window.marked.parse(contentData.issueZero.body_md);
  const issueZeroContent = `
    <div class="layout-essay">
      <div class="essay-content">
        <h2>${contentData.issueZero.title}</h2>
        ${issueZeroHtml}
      </div>
      <aside class="marginalia">
        <figure id="signal-container"></figure>
        <figcaption class="meta">FIG. 001 – LIVE SIGNAL WAVEFORM</figcaption>
      </aside>
    </div>`;
  
  // CRITICAL FIX: We must pass 'layout-essay' here as well.
  openModal(issueZeroContent, 'layout-essay');

  dom.closeModalBtn.addEventListener('click', closeModal);
  document.addEventListener('click', handleGlobalClick);

  SignalPlayer({ containerId: 'signal-player-container' }).load({});
  updateLiveData();
  setInterval(updateLiveData, 1000);
}

/* ================================================================
 *  9️⃣  RUN
 * ================================================================ */
document.addEventListener('DOMContentLoaded', initialize);