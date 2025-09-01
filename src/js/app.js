import { db } from '../content/database.js';
import { SignalPlayer } from './modules/SignalPlayer.js';
import { SensorFX } from './modules/SensorFX.js';

const dom = {
  osShell: document.getElementById('os-shell'),
  unifiedModal: document.getElementById('unifiedModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalBody: document.querySelector('.modal-body'),
  journalList: document.getElementById('journalList'),
  projectList: document.getElementById('projectList'),
  currentList: document.getElementById('currentList'),
  liveDataComponent: document.getElementById('live-data-component'),
  sensorTile: document.getElementById('sensor-tile'),
};

let contentData = {};
let activeSensor = null;
let signalAnimationId;

function openModal(content, layoutClass = '') {
  dom.modalBody.innerHTML = content;
  dom.modalBody.className = `modal-body ${layoutClass}`;
  dom.unifiedModal.removeAttribute('hidden');
  setTimeout(() => dom.unifiedModal.classList.add('is-open'), 10);
  dom.osShell.classList.add('faded');
}

function closeModal() {
  if (activeSensor) {
    activeSensor.deactivate();
    activeSensor = null;
  }
  if (signalAnimationId) {
    cancelAnimationFrame(signalAnimationId);
    signalAnimationId = null;
  }
  dom.unifiedModal.classList.remove('is-open');
  setTimeout(() => {
    dom.unifiedModal.setAttribute('hidden', '');
    dom.modalBody.innerHTML = '';
  }, 320);
  dom.osShell.classList.remove('faded');
}

function renderHubContent() {
  dom.journalList.innerHTML = contentData.journalEntries.map(item => `<li><a href="#" data-modal-trigger="journal" data-id="${item.id}">${item.title}</a><p class="meta">${item.summary}</p></li>`).join('');
  dom.projectList.innerHTML = contentData.projects.map(proj => `<li><a href="${proj.href}" target="_blank" rel="noopener">${proj.title}</a><p class="meta">${proj.note}</p></li>`).join('');
  dom.currentList.innerHTML = contentData.currentInput.map(item => `<li><strong>${item.category.toUpperCase()}</strong><p>${item.title} <em class="meta">(${item.note})</em></p></li>`).join('');
}

function updateLiveData() {
    if (!dom.liveDataComponent) return;
    const now = new Date();
    const timeUTC = now.toLocaleTimeString('en-GB', { timeZone: 'UTC' });
    const date = now.toLocaleDateString('en-CA');
    dom.liveDataComponent.textContent = `JOHANNESBURG — ${date} — ${timeUTC} UTC`;
}

function createLiveSignal(container) {
  if (!container) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute('viewBox', '0 0 100 50');
  const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
  path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'var(--accent)'); path.setAttribute('stroke-width', '0.5');
  svg.appendChild(path);
  container.innerHTML = ''; container.appendChild(svg);
  let time = 0;
  function animateSignal() {
    time += 0.05;
    let d = "M0,25";
    for (let x = 1; x <= 100; x++) { d += ` L${x},${25 + (Math.sin(x * 0.1 + time) * 15 * 0.7) + (Math.sin(x * 0.05 + time * 0.5) * 15 * 0.3)}`; }
    path.setAttribute('d', d);
    signalAnimationId = requestAnimationFrame(animateSignal);
  }
  animateSignal();
}

function handleGlobalClick(event) {
    const trigger = event.target.closest('[data-modal-trigger]');
    if (!trigger) return;
    const modalType = trigger.dataset.modalTrigger;

    if (modalType === 'journal') {
        const entry = contentData.journalEntries.find(j => j.id == trigger.dataset.id);
        if (entry) {
            const content = `<div class="essay-content"><h2>${entry.title}</h2><p class="meta">${entry.date}</p><div>${window.marked.parse(entry.summary)}</div></div>`;
            openModal(content);
        }
    }
    if (modalType === 'sensorfx') {
        const content = `<div id="sensor-canvas-container"></div>`;
        openModal(content, 'layout-sensor');
        activeSensor = SensorFX({
            tileId: 'sensor-tile',
            canvasContainerId: 'sensor-canvas-container'
        });
    }
}

function initialize() {
    contentData = db;
    renderHubContent();

    const issueZeroHtml = window.marked.parse(contentData.issueZero.body_md);
    const issueZeroContent = `
        <div class="essay-grid-container">
            <div class="essay-content">
                <h2>${contentData.issueZero.title}</h2>
                ${issueZeroHtml}
            </div>
            <aside class="marginalia">
                <figure id="signal-container"></figure>
                <figcaption class="meta">FIG. 001 - LIVE SIGNAL WAVEFORM</figcaption>
            </aside>
        </div>`;
    openModal(issueZeroContent);
    const signalContainer = document.getElementById('signal-container');
    createLiveSignal(signalContainer);

    dom.closeModalBtn.addEventListener('click', closeModal);
    document.addEventListener('click', handleGlobalClick);

    SignalPlayer({ containerId: 'signal-player-container' }).load({});
    updateLiveData();
    setInterval(updateLiveData, 1000);
}

document.addEventListener('DOMContentLoaded', initialize);