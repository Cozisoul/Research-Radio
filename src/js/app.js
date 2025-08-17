// TMM-OS: APPLICATION ORCHESTRATOR (FINAL - ESSAY-FIRST FLOW)
import { issueZero } from '../content/issue-zero.js';
import { journalData } from '../content/journal.js';
import { currentInputData } from '../content/inputs.js';
import { projectData } from '../content/project.js';
import { initPagination } from '../js/pagination.js';

const hub = document.getElementById('hub');
const projectList = document.getElementById('projectList');
const currentList = document.getElementById('currentList');
const journalList = document.getElementById('journalList');
const journalPaginationContainer = document.getElementById('journal-pagination');
const essayModal = document.getElementById('essayModal');
const essayModalContent = document.getElementById('essayModalContent');
const closeEssayBtn = document.getElementById('closeEssay');

const state = { journalCurrentPage: 0, journalItemsPerPage: 3 };

function renderEssayModal() {
  essayModalContent.innerHTML = `
    <header>
      <h2>${issueZero.title}</h2>
      <p class="dek">${issueZero.dek}</p>
      <p class="meta">${issueZero.meta}</p>
    </header>
    <section class="body">${issueZero.body}</section>
  `;
}

function renderJournalPage(pageIndex) {
  state.journalCurrentPage = pageIndex;
  const start = pageIndex * state.journalItemsPerPage;
  const end = start + state.journalItemsPerPage;
  journalList.innerHTML = journalData
    .slice(start, end)
    .map(item => `<li><a href="#">${item.title}</a><p class="meta">${item.summary}</p></li>`)
    .join('');
}

function renderProjects() {
  projectList.innerHTML = projectData
    .map(proj => `<li><a href="${proj.href}" target="_blank">${proj.title}</a><p class="meta">${proj.note}</p></li>`)
    .join('');
}

function renderInputs() {
  const grouped = currentInputData.reduce((acc, { category, ...rest }) => {
    (acc[category] = acc[category] || []).push(rest);
    return acc;
  }, {});
  currentList.innerHTML = Object.entries(grouped)
    .map(([category, items]) =>
      `<li><strong>${category.toUpperCase()}</strong><ul>${items.map(item => `<li>${item.title} <em class="meta">(${item.note})</em></li>`).join('')}</ul></li>`
    )
    .join('');
}

function initialize() {
  renderProjects();
  renderInputs();
  renderEssayModal();

  closeEssayBtn.addEventListener('click', () => {
    essayModal.setAttribute('hidden', '');
    hub.removeAttribute('hidden');
  });

  const journalPagination = initPagination({
    totalItems: journalData.length,
    itemsPerPage: state.journalItemsPerPage,
    container: journalPaginationContainer,
    onPageChange: newPage => {
      renderJournalPage(newPage);
      journalPagination.render(newPage);
    },
  });

  renderJournalPage(0);
  journalPagination?.render(0);
}

document.addEventListener('DOMContentLoaded', initialize);