// src/js/admin.js
/* 1️⃣  Import the original database.  */
import { db } from '../content/database.js';

/* 2️⃣  Make a deep copy so we can edit safely. */
let currentData = JSON.parse(JSON.stringify(db));

/* -------------------------------------------------------------------------- */
/* 3️⃣  Render form sections (current input + journal entries). */
function renderForms() {
  // Current Input – one field set per item
  const currentInputHTML = currentData.currentInput
    .map(
      (item, i) => `
        <div class="form-section">
          <h3>Input #${i + 1}</h3>
          <label>Category:</label>
          <input type="text" class="input-data" data-index="${i}" data-field="category" value="${item.category}">
          <label>Title:</label>
          <input type="text" class="input-data" data-index="${i}" data-field="title" value="${item.title}">
          <label>Note / Author:</label>
          <input type="text" class="input-data" data-index="${i}" data-field="note" value="${item.note}">
        </div>
      `
    )
    .join(' <hr> ');

  // Journal Entries
  const journalHTML = currentData.journalEntries
    .map(
      (entry, i) => `
        <div class="form-section">
          <h3>Entry #${i + 1}</h3>
          <label>Date (YYYY-MM-DD):</label>
          <input type="date" class="journal-data" data-index="${i}" data-field="date" value="${entry.date}">
          <label>Title:</label>
          <input type="text" class="journal-data" data-index="${i}" data-field="title" value="${entry.title}">
          <label>Summary (Markdown):</label>
          <textarea class="journal-data" data-index="${i}" data-field="summary">${entry.summary}</textarea>
          <button class="delete-btn" data-index="${i}">Delete Entry</button>
        </div>
      `
    )
    .join(' <hr> ');

  // Defensive: throw a helpful error if the target elements aren’t present
  const currentInputEl = document.getElementById('current-input-form');
  const journalEl = document.getElementById('journal-entries-form');
  if (!currentInputEl) throw new Error('#current-input-form not found');
  if (!journalEl) throw new Error('#journal-entries-form not found');

  currentInputEl.innerHTML = currentInputHTML;
  journalEl.innerHTML = journalHTML;
}

/* -------------------------------------------------------------------------- */
/* 4️⃣  Pull values back from the DOM into the data object. */
function updateDataFromDOM() {
  // Current Input fields
  document.querySelectorAll('.input-data').forEach(input => {
    const idx = input.dataset.index;
    const field = input.dataset.field;
    currentData.currentInput[idx][field] = input.value.trim();
  });

  // Journal fields
  document.querySelectorAll('.journal-data').forEach(input => {
    const idx = input.dataset.index;
    const field = input.dataset.field;
    currentData.journalEntries[idx][field] = input.value.trim();
  });
}

/* -------------------------------------------------------------------------- */
/* 5️⃣  Export the updated database to the user as a downloadable file. */
function saveAndDownload() {
  updateDataFromDOM();
  const jsContent = `export const db = ${JSON.stringify(currentData, null, 2)};`;

  const blob = new Blob([jsContent], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'database.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------- */
/* 6️⃣  Add a new journal‑entry (unique id + empty fields). */
function addNewJournalEntry() {
  const newId = `j-${Date.now()}`; // simple numeric id
  currentData.journalEntries.unshift({
    id: newId,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    title: '',
    summary: ''
  });

  renderForms(); // re‑render with the new entry
}

/* -------------------------------------------------------------------------- */
/* 7️⃣  Delete a journal entry via its index. */
function deleteJournalEntry(index) {
  if (!confirm(`Delete Journal Entry #${parseInt(index, 10) + 1}?`)) return;
  currentData.journalEntries.splice(index, 1);
  renderForms();
}

/* -------------------------------------------------------------------------- */
/* 8️⃣  Wire up DOM events. */
document.addEventListener('DOMContentLoaded', () => {
  renderForms(); // paint the initial state

  // Save button
  document.getElementById('save-button').addEventListener('click', saveAndDownload);

  // Add button
  document.getElementById('add-journal-entry').addEventListener('click', addNewJournalEntry);

  // Delete buttons (event delegation)
  document.getElementById('journal-entries-form').addEventListener('click', e => {
    if (e.target.classList.contains('delete-btn')) {
      deleteJournalEntry(e.target.dataset.index);
    }
  });
});
