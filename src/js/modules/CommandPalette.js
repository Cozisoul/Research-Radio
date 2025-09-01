// TMM-OS: COMMAND PALETTE UI MODULE (V1.9)
// FILE: /src/js/CommandPalette.js
// DESC: Manages the state and interactions of the search UI.

export function CommandPalette(searcher) {
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('command-input');
  const resultsList = document.getElementById('command-results');
  let onSelectCallback = () => {}; // Placeholder for what to do when an item is selected

  function renderResults(results) {
    if (!resultsList) return;
    resultsList.innerHTML = results.map(item => 
      `<li data-id="${item.id}" data-type="${item.type}">
        <span class="meta">[${item.type}]</span> ${item.title}
      </li>`
    ).join('');
  }

  function toggle(show) {
    if (!palette) return;
    if (show) {
      palette.removeAttribute('hidden');
      input.focus();
      renderResults(searcher.search('')); // Show all results initially
    } else {
      palette.setAttribute('hidden', '');
      input.value = '';
    }
  }

  // --- Event Listeners ---
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggle(!palette.hasAttribute('hidden'));
    }
    if (e.key === 'Escape' && !palette.hasAttribute('hidden')) {
      toggle(false);
    }
  });

  input.addEventListener('input', () => {
    const results = searcher.search(input.value);
    renderResults(results);
  });

  resultsList.addEventListener('click', e => {
    const target = e.target.closest('li');
    if (target) {
      console.log(`Item selected:`, { id: target.dataset.id, type: target.dataset.type });
      onSelectCallback(target.dataset); // Execute the callback with the item's data
      toggle(false);
    }
  });
  
  // Public method to set the callback
  function onSelect(callback) {
      onSelectCallback = callback;
  }

  // The public API for this module instance
  return {
    onSelect,
  };
}