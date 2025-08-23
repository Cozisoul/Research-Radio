// ============================================================
// TMM-OS: APPLICATION ORCHESTRATOR (DEFINITIVE - V1.6)
// Research Radio — The Live Archive
// This is the complete and final script. It controls all
// content loading, UI state, and peripheral initialization.
// ============================================================

// --- 1. SYSTEM IMPORTS ---
// Core modules for content, UI, and peripherals.
import { loadAllContent } from './ContentLoader.js';
import { initPagination } from './pagination.js';
import { SignalPlayer } from './SignalPlayer.js';
import { SensorFX } from './SensorFX.js';
import { ContentSearch } from './ContentSearch.js';     // NEW
import { CommandPalette } from './CommandPalette.js'; // NEW

// --- 2. DOM ELEMENT SELECTORS ---
// We select all dynamic elements of the OS Shell at startup.
const osShell = document.getElementById('os-shell');
const hub = document.getElementById('hub');
const essayModal = document.getElementById('essayModal');
const closeEssayBtn = document.getElementById('closeEssay');
const essayModalContent = document.getElementById('essayModalContent');
const essayMarginalia = document.getElementById('essayMarginalia');
const projectList = document.getElementById('projectList');
const currentList = document.getElementById('currentList');
const journalList = document.getElementById('journalList');
const journalPaginationContainer = document.getElementById('journal-pagination');

// --- 3. UI STATE FUNCTIONS ---
// These functions manage the primary states of the OS Shell.
function showEssay() {
  if (essayModal) essayModal.removeAttribute('hidden');
  if (osShell) osShell.classList.add('faded');
}

function hideEssayAndShowHub() {
  if (essayModal) essayModal.setAttribute('hidden', '');
  if (hub) hub.removeAttribute('hidden');
  if (osShell) osShell.classList.remove('faded');
}

// --- 4. RENDER FUNCTIONS ---
// These functions take data and render it into the DOM. They are the
// core of the UI and are designed to be robust and failsafe.

/**
 * Renders the main essay and its marginalia into the modal.
 * @param {object} content - The loaded content object from ContentLoader.
 */
function renderEssayModal(content) {
  if (!essayModalContent || !content || !content.issueZero) return;
  essayModalContent.innerHTML = content.issueZero;
  // Placeholder for future dynamic marginalia
  if (essayMarginalia) essayMarginalia.innerHTML = `<figure><svg viewBox="0 0 100 50" style="width:100%; border:1px solid var(--color-border);"><path d="M0 25 Q 25 0, 50 25 T 100 25" stroke="var(--color-blue)" fill="none" stroke-width="0.5"/></svg><figcaption>FIG. 001 - SIGNAL WAVEFORM</figcaption></figure>`;
}

/**
 * Renders a specific page of the journal.
 * @param {Array} journalData - The full array of journal entries.
 * @param {number} pageIndex - The zero-based index of the page to render.
 */
function renderJournalPage(journalData, pageIndex = 0) {
  if (!journalList || !journalData || journalData.length === 0) return;
  const itemsPerPage = 3;
  const start = pageIndex * itemsPerPage;
  const end = start + itemsPerPage;
  journalList.innerHTML = journalData.slice(start, end).map(item => `<li><a href="#">${item.title}</a><p class="meta">${item.summary}</p></li>`).join('');
}

/**
 * Renders the list of projects.
 * @param {Array} projectsData - The array of project objects.
 */
function renderProjects(projectsData) {
  if (!projectList || !projectsData) return;
  projectList.innerHTML = projectsData.map(proj => `<li><a href="${proj.href}" target="_blank" rel="noopener">${proj.title}</a><p class="meta">${proj.note}</p></li>`).join('');
}

/**
 * Renders the "Current Input" tile, intelligently handling different data formats.
 * @param {Array} inputsData - The array of input objects.
 */
function renderInputs(inputsData) {
  if (!currentList || !inputsData) return;
  const html = inputsData.map(item => {
    if (item.reading || item.listening) { // Key-value format
      return `<li><strong>READING</strong><p>${item.reading||'N/A'}</p></li><li><strong>LISTENING</strong><p>${item.listening||'N/A'}</p></li><li><strong>WATCHING</strong><p>${item.watching||'N/A'}</p></li><li><strong>MAKING</strong><p>${item.making||'N/A'}</p></li>`;
    }
    if (item.title && item.reflection) { // Reflection format
      return `<li><a href="${item.link}">${item.title}</a><p class="meta">${item.reflection}</p></li>`;
    }
    if (item.category && item.title) { // Category format
       return `<li><strong>${item.category.toUpperCase()}</strong><p>${item.title} <em class="meta">(${item.note})</em></p></li>`
    }
    return '';
  }).join('');
  currentList.innerHTML = `<ul>${html}</ul>`;
}


// --- 5. INITIALIZATION (THE "BOOT SEQUENCE") ---
// This async function orchestrates the entire application startup.
async function initialize() {
  // 1. Load all content from external files first. This is the critical first step.
  const content = await loadAllContent();

  // 2. Render all content into their respective (but hidden) containers.
  renderProjects(content.projects);
  renderInputs(content.inputs);
  renderEssayModal(content);
  
  // 3. Set the default UI state: show the essay modal.
  showEssay();

  // 4. Wire up the single most important user interaction.
  closeEssayBtn.addEventListener('click', hideEssayAndShowHub);

  // 5. Initialize the system peripherals.
  SignalPlayer({
    containerId: 'signal-player-container'
  }).load({
    title: 'SIGNAL 001: MAPPING MEMORY',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  });

  SensorFX({
    tileId: 'sensor-tile'
  });

  // 6. Initialize the Journal Pagination system.
  const journalPagination = initPagination({
    totalItems: content.journal.length,
    itemsPerPage: 3,
    container: journalPaginationContainer,
    onPageChange: newPage => {
      renderJournalPage(content.journal, newPage);
      journalPagination.render(newPage);
    },
  });
  renderJournalPage(content.journal, 0); // Render the first page
  journalPagination?.render(0); // Render the pagination controls

  const searcher = ContentSearch(content);
  const palette = CommandPalette(searcher);

  // 7. Define what happens when a search result is selected
  palette.onSelect(selectedItem => {
    // For now, we just log the action. In the future, this could
    // open a specific project window or scroll to a journal entry.
    console.log('Actioning selected item:', selectedItem);
    hideEssayAndShowHub(); // Show the hub so the user can see the context
  });

}

// --- 6. EXECUTION ---
// This listener waits for the HTML to be ready, then boots the OS.
document.addEventListener('DOMContentLoaded', initialize);